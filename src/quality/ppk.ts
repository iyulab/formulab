import { capabilityIndices } from './capability.js';
import type { PpkInput, PpkResult } from './types.js';
import { requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';

/** The overall mean and sample standard deviation (n − 1) of the readings. */
function overall(data: readonly number[]): { mean: number; stdDev: number } {
  if (data.length < 2) {
    throw inputRangeError('at least 2 readings are needed for an overall standard deviation', {
      code: data.length === 0 ? 'empty_input' : 'insufficient_data', parameter: 'data', min: 2, got: data.length,
    });
  }
  const mean = data.reduce((s, v) => s + v, 0) / data.length;
  const variance = data.reduce((s, v) => s + (v - mean) ** 2, 0) / (data.length - 1);
  return { mean, stdDev: Math.sqrt(variance) };
}

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
 * @param input - The limits with either the overall mean and σ, or the readings (`data`) to take them from
 * @returns Ppk analysis result
 * @throws {RangeError} usl is not greater than lsl, a limit or the mean is not finite, stdDev
 *   is negative or not finite, or `data` has fewer than 2 readings (`empty_input` / `insufficient_data`)
 */
export function ppk(input: PpkInput): PpkResult {
  requireFinite('ppk', input);
  const { usl, lsl } = input;
  const { mean, stdDev } = 'data' in input ? overall(input.data) : input;
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
