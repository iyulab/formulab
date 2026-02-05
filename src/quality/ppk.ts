import type { PpkInput, PpkResult } from './types.js';

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Standard normal CDF approximation using Abramowitz and Stegun
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
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
