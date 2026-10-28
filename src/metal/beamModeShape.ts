import { roundTo, requireFinite } from '../utils.js';
import type { BeamModeShapeInput, BeamModeShapeResult, BeamModeShapePoint } from './types.js';
import { inputRangeError } from '../errors.js';

/** Highest mode served: above this the Euler-Bernoulli model (no shear, no rotary inertia) is no longer a fair picture. */
const MAX_MODE = 10;

/** Samples used to find the peak amplitude and the nodes — fixed, so the shape never depends on the caller's `count`. */
const SCAN = 4000;

/**
 * Root λ_n of the cantilever frequency equation `1 + cos λ · cosh λ = 0`, solved as
 * `cos λ + 1/cosh λ = 0` (the same roots, without cosh's size in the residual) by Newton from the
 * asymptote `(n − ½)π` — or 1.875 for the first root, where the asymptote is still 6 % off.
 */
function cantileverLambda(mode: number): number {
  let lambda = mode === 1 ? 1.875 : (mode - 0.5) * Math.PI;
  for (let i = 0; i < 60; i++) {
    const sech = 1 / Math.cosh(lambda);
    const g = Math.cos(lambda) + sech;
    const dg = -Math.sin(lambda) - Math.sinh(lambda) * sech * sech;
    const step = g / dg;
    lambda -= step;
    if (Math.abs(step) < 1e-15) break;
  }
  return lambda;
}

/**
 * Unnormalized clamped-free mode shape
 * `cosh(βξ) − cos(βξ) − σ·(sinh(βξ) − sin(βξ))`, σ = (cosh λ + cos λ) / (sinh λ + sin λ),
 * with the hyperbolic part written in exponentials of `βξ − λ` so a high mode does not subtract two huge numbers.
 */
function cantileverShape(lambda: number): (xi: number) => number {
  const denom = Math.sinh(lambda) + Math.sin(lambda);
  const sigma = (Math.cosh(lambda) + Math.cos(lambda)) / denom;
  const oneMinus = (Math.sin(lambda) - Math.cos(lambda) - Math.exp(-lambda)) / denom; // 1 − σ, computed directly
  const onePlus = (Math.exp(lambda) + Math.sin(lambda) + Math.cos(lambda)) / denom;   // 1 + σ
  return xi => {
    const x = lambda * xi;
    return 0.5 * Math.exp(x) * oneMinus + 0.5 * Math.exp(-x) * onePlus - Math.cos(x) + sigma * Math.sin(x);
  };
}

/**
 * Mode shape of a prismatic Euler-Bernoulli beam in transverse vibration, as a curve over the
 * length — what the natural frequency of {@link vibration} belongs to. The shape depends only on the
 * supports and the mode number, not on material, section or length: positions are fractions of the
 * length (0 = the clamped / left end), amplitudes are scaled so the largest magnitude is 1, with the
 * free tip (cantilever) or the first lobe (simply supported) positive.
 *
 * @formula cantilever: φ(ξ) = cosh(λξ) − cos(λξ) − σ·(sinh(λξ) − sin(λξ)), σ = (cosh λ + cos λ) / (sinh λ + sin λ),
 *   λ the n-th root of 1 + cos λ · cosh λ = 0 (λ_1..λ_3 = 1.875104, 4.694091, 7.854757)
 * @formula simplySupported (pinned-pinned): φ(ξ) = sin(nπξ), λ = nπ, nodes at k/n
 * @reference Blevins, R.D., "Formulas for Dynamics, Acoustics and Vibration", Wiley, 2016 — Euler-Bernoulli
 *   beam mode shapes and characteristic values. Rao, S.S., "Mechanical Vibrations" — the same shape functions
 *   from the separation-of-variables derivation.
 * @units position is the dimensionless x/L; amplitude is relative (peak = 1)
 * @param count number of samples from 0 to 1 inclusive (>= 2); defaults to 101.
 * @throws {RangeError} system not 'cantilever' or 'simplySupported'; mode not an integer from 1 to 10; count not an integer >= 2.
 */
export function beamModeShape(input: BeamModeShapeInput, count = 101): BeamModeShapeResult {
  requireFinite('beamModeShape', input);
  requireFinite('beamModeShape', { count });
  const { system, mode } = input;

  if (system !== 'cantilever' && system !== 'simplySupported') {
    throw inputRangeError(`unknown system: ${String(system)}`, {
      code: 'unknown_option', parameter: 'system', got: String(system),
    });
  }
  if (!Number.isInteger(mode) || mode < 1 || mode > MAX_MODE) {
    throw inputRangeError(`mode must be an integer from 1 to ${MAX_MODE}`, {
      code: 'parameter_out_of_range', parameter: 'mode', min: 1, max: MAX_MODE, got: mode,
    });
  }
  if (!Number.isInteger(count) || count < 2) {
    throw inputRangeError('count must be an integer of at least 2', {
      code: 'parameter_out_of_range', parameter: 'count', min: 2, got: count,
    });
  }

  const lambda = system === 'cantilever' ? cantileverLambda(mode) : mode * Math.PI;
  const raw = system === 'cantilever' ? cantileverShape(lambda) : (xi: number) => Math.sin(lambda * xi);

  // Scale to a peak of 1, sign fixed by the tip (cantilever) or the first lobe (simply supported).
  let peak = 0;
  for (let i = 0; i <= SCAN; i++) peak = Math.max(peak, Math.abs(raw(i / SCAN)));
  const reference = system === 'cantilever' ? raw(1) : raw(0.5 / mode);
  const scale = (reference < 0 ? -1 : 1) / peak;
  const shape = (xi: number) => raw(xi) * scale;

  // Nodes: interior sign changes, bisected. The simply supported ones are exactly k/n.
  const nodes: number[] = [];
  if (system === 'simplySupported') {
    for (let k = 1; k < mode; k++) nodes.push(roundTo(k / mode, 4));
  } else {
    let prev = shape(1 / SCAN);
    for (let i = 2; i < SCAN; i++) {
      const cur = shape(i / SCAN);
      if (prev * cur < 0) {
        let lo = (i - 1) / SCAN;
        let hi = i / SCAN;
        for (let j = 0; j < 60; j++) {
          const mid = (lo + hi) / 2;
          if (shape(lo) * shape(mid) <= 0) hi = mid; else lo = mid;
        }
        nodes.push(roundTo((lo + hi) / 2, 4));
      }
      prev = cur;
    }
  }

  const points: BeamModeShapePoint[] = [];
  for (let i = 0; i < count; i++) {
    const xi = i / (count - 1);
    // `|| 0`: a clamped end evaluates to a few 1e-17 below zero, which rounds to -0
    points.push({ position: roundTo(xi, 6), amplitude: roundTo(shape(xi), 6) || 0 });
  }

  return { characteristicValue: roundTo(lambda, 6), nodes, points };
}
