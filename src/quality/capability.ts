import { roundTo } from '../utils.js';
import { normalCDF } from '../math.js';
import { inputRangeError } from '../errors.js';

/**
 * The capability-index arithmetic shared by `cpk()` (short-term σ), `ppk()` (long-term σ) and
 * `cmk()` (machine σ) — internal, not part of the public API.
 */
export interface CapabilityIndices {
  spread: number | null;  // Cp / Pp / Cm = (USL − LSL) / 6σ — null with a one-sided specification
  upper: number | null;   // (USL − mean) / 3σ — null without an upper limit
  lower: number | null;   // (mean − LSL) / 3σ — null without a lower limit
  index: number | null;   // min of the indices that exist
  sigmaLevel: number | null; // 3 × index
  withinSpecPercent: number;
}

/**
 * Validates the specification and σ, then computes the indices.
 *
 * A specification has an upper limit, a lower limit, or both. With one limit only the index of that
 * limit exists — AIAG·VDA SPC, «One-Sided Tolerance Limits»: a one-sided tolerance has one limit, so
 * only one index can be calculated — and the spread `(USL − LSL) / 6σ`, which is measured against the
 * width between two limits, has no value. The share within the specification is then the share below
 * the upper limit (or above the lower one).
 *
 * Every index divides by σ, so at σ = 0 they have no value and come back `null`: a 0 would read
 * as «incapable», the opposite of a process that does not vary at all. The within-spec share is
 * still defined there — every part is the mean.
 *
 * @throws {RangeError} neither limit is given, a limit or the mean is not finite, usl is not
 *   greater than lsl, or stdDev is negative or not finite
 */
export function capabilityIndices(
  usl: number | undefined,
  lsl: number | undefined,
  mean: number,
  stdDev: number,
): CapabilityIndices {
  if (usl === undefined && lsl === undefined) {
    throw inputRangeError('at least one of usl and lsl is required', { code: 'missing_option', parameter: 'usl' });
  }
  if (usl !== undefined && !Number.isFinite(usl)) {
    throw inputRangeError('usl must be finite', { code: 'value_not_finite', parameter: 'usl', got: usl });
  }
  if (lsl !== undefined && !Number.isFinite(lsl)) {
    throw inputRangeError('lsl must be finite', { code: 'value_not_finite', parameter: 'lsl', got: lsl });
  }
  // A capability is the room between two limits; with the limits crossed every index is negative.
  if (usl !== undefined && lsl !== undefined && !(usl > lsl)) {
    throw inputRangeError('usl must be greater than lsl', {
      code: 'parameter_out_of_range', parameter: 'usl', exclusive_min: lsl, got: usl,
    });
  }
  if (!Number.isFinite(mean)) {
    throw inputRangeError('mean must be finite', { code: 'value_not_finite', parameter: 'mean', got: mean });
  }
  if (!(stdDev >= 0) || !Number.isFinite(stdDev)) {
    throw inputRangeError('stdDev must not be negative', {
      code: 'parameter_out_of_range', parameter: 'stdDev', min: 0, got: stdDev,
    });
  }

  if (stdDev === 0) {
    return {
      spread: null,
      upper: null,
      lower: null,
      index: null,
      sigmaLevel: null,
      withinSpecPercent: (lsl === undefined || mean >= lsl) && (usl === undefined || mean <= usl) ? 100 : 0,
    };
  }

  const upper = usl === undefined ? null : (usl - mean) / (3 * stdDev);
  const lower = lsl === undefined ? null : (mean - lsl) / (3 * stdDev);
  const spread = usl === undefined || lsl === undefined ? null : (usl - lsl) / (6 * stdDev);
  // At least one side exists (checked above), so the minimum is a number.
  const index = Math.min(upper ?? Infinity, lower ?? Infinity);
  const withinSpecPercent =
    ((usl === undefined ? 1 : normalCDF((usl - mean) / stdDev)) - (lsl === undefined ? 0 : normalCDF((lsl - mean) / stdDev))) * 100;

  return {
    spread: spread === null ? null : roundTo(spread, 4),
    upper: upper === null ? null : roundTo(upper, 4),
    lower: lower === null ? null : roundTo(lower, 4),
    index: roundTo(index, 4),
    sigmaLevel: roundTo(3 * index, 2),
    withinSpecPercent: roundTo(withinSpecPercent, 4),
  };
}
