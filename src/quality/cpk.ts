import { roundTo } from '../utils.js';
import { normalCDF } from '../math.js';
import type { CpkInput, CpkResult } from './types.js';

/**
 * Calculate Cpk (Process Capability Index)
 *
 * @formula
 *   - Cp  = (USL - LSL) / (6σ)           — Process potential
 *   - Cpu = (USL - mean) / (3σ)          — Upper capability
 *   - Cpl = (mean - LSL) / (3σ)          — Lower capability
 *   - Cpk = min(Cpu, Cpl)                — Actual capability
 *   - Sigma Level = 3 × Cpk
 *   - Within-Spec % = [Φ((USL−mean)/σ) − Φ((LSL−mean)/σ)] × 100
 *
 * @reference Montgomery, D. C. "Introduction to Statistical Quality Control", 7th Ed. Wiley.
 * @reference ISO 22514-2:2017. Statistical methods in process management — Capability and performance.
 *
 * @units USL/LSL/mean/stdDev: same unit (e.g., mm, g); Cp/Cpk dimensionless; withinSpecPercent in %
 *
 * @remarks
 *   `withinSpecPercent` estimates the proportion of output within [LSL, USL] assuming a normal
 *   distribution with the supplied (short-term) σ. It mirrors `ppk()`'s field so the
 *   capability (`cpk`) and performance (`ppk`) APIs stay symmetric; note that for Cpk this is a
 *   short-term/potential estimate, whereas `ppk()` uses long-term σ.
 *
 * @validation
 *   - Cpk ≥ 1.33: Capable process (4σ from nearest spec)
 *   - Cpk ≥ 2.00: Six Sigma process (6σ from nearest spec)
 *   - Cpk = Cp when process is perfectly centered
 *   - stdDev ≤ 0: returns a zero-valued result (no meaningful capability); does not throw
 *
 * @param input - Cpk input parameters
 * @returns Cpk result with capability indices, sigma level, and within-spec percentage
 */
export function cpk(input: CpkInput): CpkResult {
  const { usl, lsl, mean, stdDev } = input;

  // Edge case — non-positive σ has no meaningful capability; return zero sentinel
  if (stdDev <= 0) {
    return { cp: 0, cpk: 0, cpu: 0, cpl: 0, withinSpecPercent: 0, sigmaLevel: 0 };
  }

  // Cp = (USL - LSL) / (6 * sigma)
  const cp = (usl - lsl) / (6 * stdDev);

  // Cpu = (USL - mean) / (3 * sigma)
  const cpu = (usl - mean) / (3 * stdDev);

  // Cpl = (mean - LSL) / (3 * sigma)
  const cpl = (mean - lsl) / (3 * stdDev);

  // Cpk = min(Cpu, Cpl)
  const cpkValue = Math.min(cpu, cpl);

  // Sigma level = min z-score = 3 * Cpk
  const sigmaLevel = 3 * cpkValue;

  // Estimated fraction within spec under a normal model (short-term σ)
  const zUpper = (usl - mean) / stdDev;
  const zLower = (lsl - mean) / stdDev;
  const withinSpecPercent = (normalCDF(zUpper) - normalCDF(zLower)) * 100;

  return {
    cp: roundTo(cp, 4),
    cpk: roundTo(cpkValue, 4),
    cpu: roundTo(cpu, 4),
    cpl: roundTo(cpl, 4),
    withinSpecPercent: roundTo(withinSpecPercent, 4),
    sigmaLevel: roundTo(sigmaLevel, 2),
  };
}
