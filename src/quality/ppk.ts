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
 * @remarks
 *   Field naming is aligned with `cpk()` for a symmetric capability/performance API:
 *   prefer `ppu`/`ppl`/`sigmaLevel`. The legacy `ppUpper`/`ppLower`/`sigma` fields are
 *   retained as deprecated aliases (identical values) and will be removed in a future release.
 *
 * @param input - Ppk input parameters
 * @returns Ppk analysis result
 */
export function ppk(input: PpkInput): PpkResult {
  const { usl, lsl, mean, stdDev } = input;

  // Handle invalid inputs
  if (stdDev <= 0) {
    return {
      pp: 0,
      ppk: 0,
      ppu: 0,
      ppl: 0,
      withinSpecPercent: 0,
      sigmaLevel: 0,
      // Deprecated aliases (kept for backward compatibility)
      ppUpper: 0,
      ppLower: 0,
      sigma: 0,
    };
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
  const sigmaLevel = 3 * ppkValue;

  const ppuRounded = roundTo(ppUpper, 4);
  const pplRounded = roundTo(ppLower, 4);
  const sigmaLevelRounded = roundTo(sigmaLevel, 2);

  return {
    pp: roundTo(pp, 4),
    ppk: roundTo(ppkValue, 4),
    ppu: ppuRounded,
    ppl: pplRounded,
    withinSpecPercent: roundTo(withinSpecPercent, 4),
    sigmaLevel: sigmaLevelRounded,
    // Deprecated aliases (kept for backward compatibility); identical values to ppu/ppl/sigmaLevel
    ppUpper: ppuRounded,
    ppLower: pplRounded,
    sigma: sigmaLevelRounded,
  };
}
