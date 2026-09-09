import { roundTo } from '../utils.js';
import type { MtbfInput, MtbfResult } from './types.js';

/**
 * Calculate MTBF (Mean Time Between Failures) and related reliability metrics
 *
 * MTBF = Total Operating Time / Number of Failures
 * MTTR = Total Repair Time / Number of Failures
 * Availability = MTBF / (MTBF + MTTR)
 *
 * Each output maps to a defined term:
 *   - `mtbf` — "average of the times between failures" (EN 13306:2017, 11.3). Note that a
 *     time between failures (9.18) is the duration between consecutive failures and "may
 *     include non-operating time after restoration"; when the input is operating time, as
 *     here, the quantity computed is strictly the mean operating time between failures
 *     (MOTBF, 11.2 — "average of the operating times between failures", applied to
 *     repairable items). Industry practice calls this figure MTBF, and the name is kept for
 *     that reason.
 *   - `mttr` — mean repair time (MRT, 11.4: "average of the repair times"). MTTR is the
 *     common industry spelling of the same average.
 *   - `availability` — the time-based availability ratio of 4.9: up time over total time
 *     (UT / (UT + DT)), expressed as a percentage.
 *   - `failureRate`, `reliabilityAtMtbf` — the constant-failure-rate (exponential) model,
 *     lambda = 1 / MTBF and R(t) = exp(-lambda·t). Not part of the terminology standard;
 *     it holds only during a constant failure period, and R(MTBF) = e^-1 always.
 *
 * @reference EN 13306:2017 — Maintenance terminology. 11.3 (mean time between failures),
 *   11.2 (mean operating time between failures), 11.4 (mean repair time), 9.18 (time
 *   between failures), 4.9 (time based availability).
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
  if (totalRepairTime < 0) {
    throw new RangeError('totalRepairTime must not be negative');
  }

  // Every derived figure below is computed from the raw times, never from the rounded
  // values reported back. Rounding an intermediate to 2 decimals and then dividing by it
  // is not a rounding whisker: with short times spread over many failures the rounded
  // mean is a large fraction of its own value, and availability drifts by whole points
  // (1 h operating / 0.5 h repair / 34 failures reads 75% that way, against a true 66.67%).
  const mtbfExact = totalOperatingTime / numberOfFailures;
  const mttrExact = totalRepairTime / numberOfFailures;

  // MTBF = Total Operating Time / Number of Failures
  const mtbfValue = roundTo(mtbfExact, 2);

  // MTTR = Total Repair Time / Number of Failures
  const mttr = roundTo(mttrExact, 2);

  // Availability = MTBF / (MTBF + MTTR). The failure count cancels, leaving the 4.9
  // time-based ratio of up time to total time.
  const availability = roundTo((totalOperatingTime / (totalOperatingTime + totalRepairTime)) * 100, 2);

  // Failure rate (lambda) = 1 / MTBF
  const failureRate = roundTo(1 / mtbfExact, 6);

  // Reliability at time T = e^(-lambda * T), where T = MTBF
  // R(MTBF) = e^(-1) = 0.3679 = 36.79%, whatever the MTBF is
  const reliabilityAtMtbf = roundTo(Math.exp(-1) * 100, 2);

  return {
    mtbf: mtbfValue,
    mttr,
    availability,
    failureRate,
    reliabilityAtMtbf,
  };
}
