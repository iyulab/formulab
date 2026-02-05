import type { CpkInput, CpkResult } from './types.js';

/**
 * Calculate Cpk (Process Capability Index)
 *
 * Cp = (USL - LSL) / (6 * sigma)  - Process capability (potential)
 * Cpu = (USL - mean) / (3 * sigma) - Upper capability
 * Cpl = (mean - LSL) / (3 * sigma) - Lower capability
 * Cpk = min(Cpu, Cpl) - Process capability index (actual)
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
