import type { CpkInput, CpkResult } from './types.js';

/**
 * Calculate Cpk (Process Capability Index)
 *
 * @formula
 *   - Cp  = (USL - LSL) / (6σ)   — Process potential
 *   - Cpu = (USL - mean) / (3σ)   — Upper capability
 *   - Cpl = (mean - LSL) / (3σ)   — Lower capability
 *   - Cpk = min(Cpu, Cpl)         — Actual capability
 *   - Sigma Level = 3 × Cpk
 *
 * @reference Montgomery, D. C. "Introduction to Statistical Quality Control", 7th Ed. Wiley.
 * @reference ISO 22514-2:2017. Statistical methods in process management — Capability and performance.
 *
 * @units USL/LSL/mean/stdDev: same unit (e.g., mm, g); Cpk is dimensionless
 *
 * @validation
 *   - Cpk ≥ 1.33: Capable process (4σ from nearest spec)
 *   - Cpk ≥ 2.00: Six Sigma process (6σ from nearest spec)
 *   - Cpk = Cp when process is perfectly centered
 *
 * @param input - Cpk input parameters
 * @returns Cpk result with capability indices and sigma level
 */
export function cpk(input: CpkInput): CpkResult {
  const { usl, lsl, mean, stdDev } = input;

  // Handle edge case - return zeros for zero standard deviation
  if (stdDev <= 0) {
    return {
      cp: 0,
      cpk: 0,
      cpu: 0,
      cpl: 0,
      sigmaLevel: 0,
    };
  }

  // Specification width
  const specWidth = usl - lsl;

  // Cp = (USL - LSL) / (6 * sigma)
  const cp = specWidth / (6 * stdDev);

  // Cpu = (USL - mean) / (3 * sigma)
  const cpu = (usl - mean) / (3 * stdDev);

  // Cpl = (mean - LSL) / (3 * sigma)
  const cpl = (mean - lsl) / (3 * stdDev);

  // Cpk = min(Cpu, Cpl)
  const cpkValue = Math.min(cpu, cpl);

  // Sigma level = min z-score = 3 * Cpk
  const sigmaLevel = 3 * cpkValue;

  return {
    cp,
    cpk: cpkValue,
    cpu,
    cpl,
    sigmaLevel,
  };
}
