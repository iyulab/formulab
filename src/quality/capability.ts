import { roundTo } from '../utils.js';
import { normalCDF } from '../math.js';

/**
 * The capability-index arithmetic shared by `cpk()` (short-term σ), `ppk()` (long-term σ) and
 * `cmk()` (machine σ) — internal, not part of the public API.
 */
export interface CapabilityIndices {
  spread: number | null;  // Cp / Pp / Cm = (USL − LSL) / 6σ
  upper: number | null;   // (USL − mean) / 3σ
  lower: number | null;   // (mean − LSL) / 3σ
  index: number | null;   // min(upper, lower)
  sigmaLevel: number | null; // 3 × index
  withinSpecPercent: number;
}

/**
 * Validates the specification and σ, then computes the indices.
 *
 * Every index divides by σ, so at σ = 0 they have no value and come back `null`: a 0 would read
 * as «incapable», the opposite of a process that does not vary at all. The within-spec share is
 * still defined there — every part is the mean.
 *
 * @throws {RangeError} a limit or the mean is not finite, usl is not greater than lsl, or
 *   stdDev is negative or not finite
 */
export function capabilityIndices(usl: number, lsl: number, mean: number, stdDev: number): CapabilityIndices {
  if (!Number.isFinite(usl) || !Number.isFinite(lsl)) {
    throw new RangeError('usl and lsl must be finite');
  }
  // A capability is the room between two limits; with the limits crossed every index is negative.
  if (!(usl > lsl)) {
    throw new RangeError('usl must be greater than lsl');
  }
  if (!Number.isFinite(mean)) {
    throw new RangeError('mean must be finite');
  }
  if (!(stdDev >= 0) || !Number.isFinite(stdDev)) {
    throw new RangeError('stdDev must not be negative');
  }

  if (stdDev === 0) {
    return {
      spread: null,
      upper: null,
      lower: null,
      index: null,
      sigmaLevel: null,
      withinSpecPercent: mean >= lsl && mean <= usl ? 100 : 0,
    };
  }

  const spread = (usl - lsl) / (6 * stdDev);
  const upper = (usl - mean) / (3 * stdDev);
  const lower = (mean - lsl) / (3 * stdDev);
  const index = Math.min(upper, lower);
  const withinSpecPercent = (normalCDF((usl - mean) / stdDev) - normalCDF((lsl - mean) / stdDev)) * 100;

  return {
    spread: roundTo(spread, 4),
    upper: roundTo(upper, 4),
    lower: roundTo(lower, 4),
    index: roundTo(index, 4),
    sigmaLevel: roundTo(3 * index, 2),
    withinSpecPercent: roundTo(withinSpecPercent, 4),
  };
}
