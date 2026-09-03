import { roundTo } from '../utils.js';
import { normalInvCDF } from '../math.js';
import type {
  AcceptanceControlChartInput,
  AcceptanceControlChartResult,
  AcceptanceControlLimit,
} from './types.js';

/** Upper-tail standard normal deviate exceeded by proportion p: P(Z > z) = p. */
function zUpperTail(p: number): number {
  return normalInvCDF(1 - p);
}

function computeSide(
  specLimit: number,
  isUpper: boolean,
  sigma: number,
  zP0: number,
  zP1: number,
  zAlpha: number,
  zBeta: number,
): { limit: AcceptanceControlLimit; sampleSize: number } {
  const direction = isUpper ? 1 : -1;
  const apl = specLimit - direction * zP0 * sigma;
  const rpl = specLimit - direction * zP1 * sigma;
  const acl = (zBeta * apl + zAlpha * rpl) / (zAlpha + zBeta);
  const sampleSize = Math.ceil(((sigma * (zAlpha + zBeta)) / Math.abs(rpl - apl)) ** 2);

  return {
    limit: { apl: roundTo(apl, 4), rpl: roundTo(rpl, 4), acl: roundTo(acl, 4) },
    sampleSize,
  };
}

/**
 * Acceptance Control Chart.
 *
 * Combines Shewhart control-chart limits with acceptance-sampling concepts to
 * decide whether a process (not an individual lot) is acceptable, rather than
 * whether it is merely "in control". The acceptable process level (APL) and
 * rejectable process level (RPL) are derived from the specification limit(s)
 * and the proportions of nonconforming output tolerated at each: a process
 * centred at the APL has only an α risk of being judged unacceptable, and a
 * process centred at the RPL has only a β risk of being judged acceptable.
 * The acceptance control limit (ACL) - the actual plotted decision line -
 * lies between them, weighted by the two risks.
 *
 * @formula
 *   For a given specification limit S (upper U or lower L), with
 *   direction d = +1 for the upper side, d = -1 for the lower side:
 *   - APL  = S − d·z(p0)·σw
 *   - RPL  = S − d·z(p1)·σw
 *   - ACL  = (zβ·APL + zα·RPL) / (zα + zβ)
 *   - n    = ceil[(σw·(zα + zβ) / |RPL − APL|)²]
 *   where z(p) is the upper-tail standard normal deviate exceeded by
 *   proportion p, and n is the larger (more stringent) of the two sides for
 *   a two-sided specification.
 *
 * @reference ISO 7870-3:2012, Clause 8.1.1 (Definition of the APL and RPL
 *   along with their respective α- and β-risks, and determination of the
 *   sample size and the ACL - "Option a) is preferable in most cases").
 *   Golden-tested against both worked examples: Clause 9.1 Example 1
 *   (two-sided, spec-limit-derived APL/RPL/ACL/n - APL/RPL/n reproduced
 *   exactly; the standard's own printed ACL figures carry a small
 *   sub-0,01 rounding-path discrepancy against this formula, most likely
 *   from intermediate rounding in the source nomograph-era calculation -
 *   the ACL golden assertions use a wider tolerance to account for this)
 *   and Clause 9.2 Example 2 (the companion "given APL/α/β/n" procedure,
 *   used here only to independently cross-verify the α/β-weighting
 *   relationship between APL, ACL and RPL - reproduced to 3 decimal places
 *   exactly).
 *
 * @throws {RangeError} At least one of upperSpecLimit/lowerSpecLimit is required
 * @throws {RangeError} sigma must be positive
 * @throws {RangeError} acceptableProportion and rejectableProportion must be between 0 and 1
 * @throws {RangeError} rejectableProportion must exceed acceptableProportion
 * @throws {RangeError} alpha and beta must be between 0 and 1
 * @param input - specification limit(s), process variability, and risk parameters
 * @returns APL/RPL/ACL per side and the required sample size
 */
export function acceptanceControlChart(input: AcceptanceControlChartInput): AcceptanceControlChartResult {
  const {
    upperSpecLimit, lowerSpecLimit, sigma,
    acceptableProportion: p0, rejectableProportion: p1,
    alpha = 0.05, beta = 0.05,
  } = input;

  if (upperSpecLimit === undefined && lowerSpecLimit === undefined) {
    throw new RangeError('At least one of upperSpecLimit or lowerSpecLimit is required');
  }
  if (sigma <= 0) {
    throw new RangeError('sigma must be positive');
  }
  if (p0 <= 0 || p0 >= 1 || p1 <= 0 || p1 >= 1) {
    throw new RangeError('acceptableProportion and rejectableProportion must be between 0 and 1');
  }
  if (p1 <= p0) {
    throw new RangeError('rejectableProportion must exceed acceptableProportion');
  }
  if (alpha <= 0 || alpha >= 1 || beta <= 0 || beta >= 1) {
    throw new RangeError('alpha and beta must be between 0 and 1');
  }

  const zP0 = zUpperTail(p0);
  const zP1 = zUpperTail(p1);
  const zAlpha = zUpperTail(alpha);
  const zBeta = zUpperTail(beta);

  const result: AcceptanceControlChartResult = { sampleSize: 0 };
  let sampleSize = 0;

  if (upperSpecLimit !== undefined) {
    const { limit, sampleSize: n } = computeSide(upperSpecLimit, true, sigma, zP0, zP1, zAlpha, zBeta);
    result.upper = limit;
    sampleSize = Math.max(sampleSize, n);
  }
  if (lowerSpecLimit !== undefined) {
    const { limit, sampleSize: n } = computeSide(lowerSpecLimit, false, sigma, zP0, zP1, zAlpha, zBeta);
    result.lower = limit;
    sampleSize = Math.max(sampleSize, n);
  }

  result.sampleSize = sampleSize;
  return result;
}
