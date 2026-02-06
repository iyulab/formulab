import { roundTo } from '../utils.js';
import { normalCDF } from '../math.js';
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
 * @param input - Ppk input parameters
 * @returns Ppk analysis result
 */
export function ppk(input: PpkInput): PpkResult {
  const { usl, lsl, mean, stdDev } = input;

  // Handle invalid inputs
  if (stdDev <= 0) {
    return { pp: 0, ppk: 0, ppUpper: 0, ppLower: 0, withinSpecPercent: 0, sigma: 0 };
  }

  // Calculate Pp (process performance spread)
  const pp = (usl - lsl) / (6 * stdDev);

  // Calculate Ppu and Ppl
  const ppUpper = (usl - mean) / (3 * stdDev);
  const ppLower = (mean - lsl) / (3 * stdDev);

  // Ppk is minimum of Ppu and Ppl
  const ppkValue = Math.min(ppUpper, ppLower);

  // Calculate within spec percentage using normal distribution
  const zUpper = (usl - mean) / stdDev;
  const zLower = (lsl - mean) / stdDev;
  const withinSpecPercent = (normalCDF(zUpper) - normalCDF(zLower)) * 100;

  // Sigma level = 3 * Ppk
  const sigma = 3 * ppkValue;

  return {
    pp: roundTo(pp, 4),
    ppk: roundTo(ppkValue, 4),
    ppUpper: roundTo(ppUpper, 4),
    ppLower: roundTo(ppLower, 4),
    withinSpecPercent: roundTo(withinSpecPercent, 4),
    sigma: roundTo(sigma, 2),
  };
}
