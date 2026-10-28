import { capabilityIndices } from './capability.js';
import type { CpkInput, CpkResult } from './types.js';
import { requireFinite } from '../utils.js';

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
 *   - One-sided specification (only USL or only LSL): only that side's index exists — Cpk = Cpu or
 *     Cpl, Cp is null, and Within-Spec % keeps just the given limit (Φ((USL−mean)/σ), or 1 − Φ((LSL−mean)/σ))
 *
 * @reference Montgomery, D. C. "Introduction to Statistical Quality Control", 7th Ed. Wiley.
 * @reference ISO 22514-2:2017. Statistical methods in process management — Capability and performance.
 * @reference AIAG & VDA, SPC manual — one-sided tolerance limits: a one-sided tolerance has one limit, so only
 *   the index of that limit is calculated.
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
 *   - stdDev = 0: every index is `null` (it divides by σ); withinSpecPercent is 100 or 0
 *
 * @param input - Cpk input parameters
 * @returns Cpk result with capability indices, sigma level, and within-spec percentage
 * @throws {RangeError} neither usl nor lsl is given (`missing_option`), usl is not greater than lsl,
 *   a limit or the mean is not finite, or stdDev is negative or not finite
 */
export function cpk(input: CpkInput): CpkResult {
  requireFinite('cpk', input);
  const { usl, lsl, mean, stdDev } = input;
  const c = capabilityIndices(usl, lsl, mean, stdDev);
  return {
    cp: c.spread,
    cpk: c.index,
    cpu: c.upper,
    cpl: c.lower,
    withinSpecPercent: c.withinSpecPercent,
    sigmaLevel: c.sigmaLevel,
  };
}
