import { roundTo } from '../utils.js';
import type {
  BeamSupportType,
  BeamDeflectionInput,
  BeamDeflectionResult,
  BeamDeflectionCurvePoint,
} from './types.js';

/**
 * Elastic deflected shape v(x) of a prismatic beam under a uniform load w (N/mm) and/or
 * a point load P (N) at the canonical maximum-deflection location, superposed.
 *
 * x is measured from the left support (simple/fixed) or the fixed end (cantilever), in mm.
 * EI = E·I in N·mm². v is downward-positive, in mm.
 *
 * Closed-form shape functions (mechanics-of-materials standard):
 * - simple     uniform:      w·x·(L³ − 2L·x² + x³) / 24EI                    (max 5wL⁴/384EI at L/2)
 * - simple     point @ L/2:  P·x·(3L² − 4x²) / 48EI, mirrored past midspan   (max PL³/48EI at L/2)
 * - cantilever uniform:      w·x²·(x² − 4L·x + 6L²) / 24EI                    (max wL⁴/8EI at L)
 * - cantilever point @ free: P·x²·(3L − x) / 6EI                             (max PL³/3EI at L)
 * - fixed      uniform:      w·x²·(L − x)² / 24EI                            (max wL⁴/384EI at L/2)
 * - fixed      point @ L/2:  P·x²·(3L − 4x) / 48EI, mirrored past midspan    (max PL³/192EI at L/2)
 *
 * Each shape's analytic maximum equals the closed form used elsewhere in this module,
 * so the sampled curve and the reported δ_max never drift.
 */
function shapeDeflection(
  support: BeamSupportType,
  x: number,
  L: number,
  EI: number,
  w: number,
  P: number,
): number {
  let v = 0;

  if (support === 'simple') {
    if (w > 0) v += (w * x * (L ** 3 - 2 * L * x ** 2 + x ** 3)) / (24 * EI);
    if (P > 0) {
      const xm = x <= L / 2 ? x : L - x; // mirror about midspan (symmetric central load)
      v += (P * xm * (3 * L ** 2 - 4 * xm ** 2)) / (48 * EI);
    }
  } else if (support === 'cantilever') {
    if (w > 0) v += (w * x ** 2 * (x ** 2 - 4 * L * x + 6 * L ** 2)) / (24 * EI);
    if (P > 0) v += (P * x ** 2 * (3 * L - x)) / (6 * EI);
  } else {
    // fixed-fixed
    if (w > 0) v += (w * x ** 2 * (L - x) ** 2) / (24 * EI);
    if (P > 0) {
      const xm = x <= L / 2 ? x : L - x;
      v += (P * xm ** 2 * (3 * L - 4 * xm)) / (48 * EI);
    }
  }

  return v;
}

/** Location (mm from left/fixed end) of the maximum deflection for a given support. */
function maxLocation(support: BeamSupportType, L: number): number {
  return support === 'cantilever' ? L : L / 2;
}

function resolveLoads(input: BeamDeflectionInput): { w: number; P: number } {
  const { loadType, uniformLoad, pointLoad } = input;
  const needUniform = loadType === 'uniform' || loadType === 'combined';
  const needPoint = loadType === 'concentrated' || loadType === 'combined';

  if (needUniform && (uniformLoad === undefined || uniformLoad === null)) {
    throw new RangeError('uniformLoad is required for uniform/combined load type');
  }
  if (needPoint && (pointLoad === undefined || pointLoad === null)) {
    throw new RangeError('pointLoad is required for concentrated/combined load type');
  }

  return {
    w: needUniform ? (uniformLoad as number) : 0,
    P: needPoint ? (pointLoad as number) : 0,
  };
}

/**
 * Maximum elastic deflection of a prismatic beam and its serviceability check.
 *
 * # Units (SI, mm-based)
 * E in MPa (= N/mm²), I in mm⁴, span L in mm, w in N/mm, P in N → deflection in mm.
 * This mm/N/MPa convention lets the moment of inertia flow straight from
 * {@link momentOfInertia} (which returns I in mm⁴) into this calculation.
 *
 * # What it returns
 * δ_max (at its canonical location), the allowable deflection span/ratio for the chosen
 * serviceability limit (e.g. L/360), their ratio (utilization), and an `isSafe` verdict.
 *
 * # v1 scope (deliberately simple — matches common baseline calculators)
 * 1. **Elastic, small-deflection, prismatic (constant EI) beam.** Linear superposition of
 *    a uniform and a point load.
 * 2. **Point load acts at the canonical maximum-deflection location** — midspan for
 *    simple/fixed supports, the free end for a cantilever. Off-centre point loads (whose
 *    peak is neither midspan nor the load point) are deferred, not approximated.
 * 3. Because both the uniform peak and the (canonically placed) point peak occur at the
 *    same location, the combined case superposes there exactly — the reported δ_max is
 *    the true combined maximum, not a same-location estimate.
 *
 * Reference: any mechanics-of-materials text (e.g. Roark's Formulas for Stress and Strain).
 *
 * @throws {RangeError} span, youngsModulus, momentOfInertia, or deflectionLimitRatio is
 *   not positive, or a load value required by the selected load type is missing.
 */
export function beamDeflection(input: BeamDeflectionInput): BeamDeflectionResult {
  const { support, span, youngsModulus, momentOfInertia, deflectionLimitRatio } = input;

  if (span <= 0) {
    throw new RangeError('span must be greater than 0');
  }
  if (youngsModulus <= 0) {
    throw new RangeError('youngsModulus must be greater than 0');
  }
  if (momentOfInertia <= 0) {
    throw new RangeError('momentOfInertia must be greater than 0');
  }
  if (deflectionLimitRatio <= 0) {
    throw new RangeError('deflectionLimitRatio must be greater than 0');
  }

  const { w, P } = resolveLoads(input);
  const L = span;
  const EI = youngsModulus * momentOfInertia; // N·mm²

  const location = maxLocation(support, L);
  const maxDeflection = shapeDeflection(support, location, L, EI, w, P);
  const allowableDeflection = L / deflectionLimitRatio;
  const deflectionRatio = maxDeflection / allowableDeflection;

  return {
    maxDeflection: roundTo(maxDeflection, 4),
    maxDeflectionLocation: roundTo(location, 1),
    allowableDeflection: roundTo(allowableDeflection, 3),
    deflectionRatio: roundTo(deflectionRatio, 3),
    isSafe: maxDeflection <= allowableDeflection,
  };
}

/**
 * Sample the elastic deflected shape v(x) from 0 to span for visualization. Uses the
 * same shape functions as {@link beamDeflection}, so `max(curve)` equals its `maxDeflection`
 * (no second physics — the drawn curve cannot contradict the reported peak).
 *
 * @param count number of samples (>= 2); defaults to 41.
 * @throws {RangeError} same validation as {@link beamDeflection}, plus count < 2.
 */
export function beamDeflectionCurve(input: BeamDeflectionInput, count = 41): BeamDeflectionCurvePoint[] {
  if (input.span <= 0) {
    throw new RangeError('span must be greater than 0');
  }
  if (input.youngsModulus <= 0) {
    throw new RangeError('youngsModulus must be greater than 0');
  }
  if (input.momentOfInertia <= 0) {
    throw new RangeError('momentOfInertia must be greater than 0');
  }
  if (count < 2) {
    throw new RangeError('count must be at least 2');
  }

  const { w, P } = resolveLoads(input);
  const L = input.span;
  const EI = input.youngsModulus * input.momentOfInertia;

  const points: BeamDeflectionCurvePoint[] = [];
  for (let i = 0; i < count; i++) {
    const x = (L * i) / (count - 1);
    points.push({
      position: roundTo(x, 2),
      deflection: roundTo(shapeDeflection(input.support, x, L, EI, w, P), 4),
    });
  }
  return points;
}
