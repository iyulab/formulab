import { roundTo } from '../utils.js';
import type { MtbfInput, MtbfResult } from './types.js';

/**
 * Calculate MTBF (Mean Time Between Failures) and related reliability metrics
 *
 * MTBF = Total Operating Time / Number of Failures
 * MTTR = Total Repair Time / Number of Failures
 * Availability = MTBF / (MTBF + MTTR)
 *
 * @param input - MTBF input parameters
 * @returns MTBF analysis result
 * @throws RangeError if totalOperatingTime is not positive, or if
 *   numberOfFailures is not positive (MTBF is undefined with zero failures)
 */
export function mtbf(input: MtbfInput): MtbfResult {
  const { totalOperatingTime, totalRepairTime, numberOfFailures } = input;

  // Validate inputs
  if (totalOperatingTime <= 0) {
    throw new RangeError('totalOperatingTime must be greater than 0');
  }
  if (numberOfFailures <= 0) {
    throw new RangeError('numberOfFailures must be greater than 0');
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
