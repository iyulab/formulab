import { capabilityIndices } from './capability.js';
import type { PpkInput, PpkResult } from './types.js';

/**
 * Calculate Process Performance Index (Ppk)
 * Similar to Cpk but uses overall (long-term) standard deviation
 *
 * Pp = (USL - LSL) / 6sigma  (process spread)
 * Ppu = (USL - mu) / 3sigma   (upper capability)
 * Ppl = (mu - LSL) / 3sigma   (lower capability)
 * Ppk = min(Ppu, Ppl)    (process performance)
 *
 * @remarks Field naming is aligned with `cpk()` for a symmetric capability/performance API. With
 *   stdDev = 0 every index is `null` (it divides by σ) and withinSpecPercent is 100 or 0.
 *
 * @param input - Ppk input parameters
 * @returns Ppk analysis result
 * @throws {RangeError} usl is not greater than lsl, a limit or the mean is not finite, or stdDev
 *   is negative or not finite
 */
export function ppk(input: PpkInput): PpkResult {
  const { usl, lsl, mean, stdDev } = input;
  const c = capabilityIndices(usl, lsl, mean, stdDev);
  return {
    pp: c.spread,
    ppk: c.index,
    ppu: c.upper,
    ppl: c.lower,
    withinSpecPercent: c.withinSpecPercent,
    sigmaLevel: c.sigmaLevel,
  };
}
