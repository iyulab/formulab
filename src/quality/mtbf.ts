import type { MtbfInput, MtbfResult } from './types.js';

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate MTBF (Mean Time Between Failures) and related reliability metrics
 *
 * MTBF = Total Operating Time / Number of Failures
 * MTTR = Total Repair Time / Number of Failures
 * Availability = MTBF / (MTBF + MTTR)
 *
 * @param input - MTBF input parameters
 * @returns MTBF analysis result
 */
export function mtbf(input: MtbfInput): MtbfResult {
  const { totalOperatingTime, totalRepairTime, numberOfFailures } = input;

  // Handle invalid input
  if (totalOperatingTime <= 0 || numberOfFailures <= 0) {
    return {
      mtbf: 0,
      mttr: 0,
      availability: 0,
      failureRate: 0,
      reliabilityAtMtbf: 0,
    };
  }

  // MTBF = Total Operating Time / Number of Failures
  const mtbfValue = roundTo(totalOperatingTime / numberOfFailures, 2);

  // MTTR = Total Repair Time / Number of Failures
  const mttr = numberOfFailures > 0 ? roundTo(totalRepairTime / numberOfFailures, 2) : 0;

  // Availability = MTBF / (MTBF + MTTR)
  const availability = mtbfValue + mttr > 0
    ? roundTo((mtbfValue / (mtbfValue + mttr)) * 100, 2)
    : 0;

  // Failure rate (lambda) = 1 / MTBF
  const failureRate = mtbfValue > 0 ? roundTo(1 / mtbfValue, 6) : 0;

  // Reliability at time T = e^(-lambda * T), where T = MTBF
  // R(MTBF) = e^(-1) = 0.3679 = 36.79%
  const reliabilityAtMtbf = mtbfValue > 0 ? roundTo(Math.exp(-1) * 100, 2) : 0;

  return {
    mtbf: mtbfValue,
    mttr,
    availability,
    failureRate,
    reliabilityAtMtbf,
  };
}
