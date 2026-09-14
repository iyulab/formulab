import { roundTo } from '../utils.js';
import { multiplicativeCascade } from '../math.js';
import type { OeeInput, OeeResult } from './types.js';

/**
 * Calculate OEE (Overall Equipment Effectiveness)
 *
 * @formula OEE = Availability × Performance × Quality
 *   - Availability = Run Time / Planned Production Time
 *   - Performance = (Ideal Cycle Time × Total Count) / Run Time
 *   - Quality = Good Count / Total Count
 *
 * @reference JIPM (1999). "TPM for Workshop Leaders", 3rd Ed.
 * @reference ISO 22400-2:2014. Key performance indicators for manufacturing operations.
 * @reference Nakajima, S. (1988). "Introduction to TPM". Productivity Press.
 *
 * @units plannedTime: minutes, runTime: minutes, idealCycleTime: minutes/piece
 *
 * @validation World-class benchmarks: A ≥ 90%, P ≥ 95%, Q ≥ 99.9% → OEE ≈ 85%
 *
 * @param input - OEE input parameters with raw production data
 * @returns OEE result with factors (0-1), percentages (0-100), and `cascade` — 100 % reduced by
 *   availability, performance, quality in that order (unrounded; last `remaining` is OEE %)
 * @throws {RangeError} plannedTime, runTime, idealCycleTime or totalCount ≤ 0; runTime > plannedTime;
 *   goodCount < 0 or > totalCount
 */
export function oee(input: OeeInput): OeeResult {
  const { rawData } = input;
  const { plannedTime, runTime, totalCount, goodCount, idealCycleTime } = rawData;

  if (plannedTime <= 0) {
    throw new RangeError(`Invalid input: plannedTime (${plannedTime}) must be positive`);
  }
  if (runTime <= 0) {
    throw new RangeError(`Invalid input: runTime (${runTime}) must be positive`);
  }
  if (runTime > plannedTime) {
    throw new RangeError(
      `Invalid input: runTime (${runTime}) cannot exceed plannedTime (${plannedTime})`
    );
  }
  if (idealCycleTime <= 0) {
    throw new RangeError(`Invalid input: idealCycleTime (${idealCycleTime}) must be positive`);
  }
  if (totalCount <= 0) {
    throw new RangeError(`Invalid input: totalCount (${totalCount}) must be positive`);
  }
  if (goodCount < 0) {
    throw new RangeError(`Invalid input: goodCount (${goodCount}) cannot be negative`);
  }
  if (goodCount > totalCount) {
    throw new RangeError(
      `Invalid input: goodCount (${goodCount}) cannot exceed totalCount (${totalCount})`
    );
  }

  // Availability = Run Time / Planned Time
  const availability = runTime / plannedTime;

  // Performance = (Ideal Cycle Time x Total Count) / Run Time
  // Note: idealCycleTime is in minutes, runTime is in minutes
  const performance = (idealCycleTime * totalCount) / runTime;

  // Quality = Good Count / Total Count
  const quality = goodCount / totalCount;

  // OEE = Availability x Performance x Quality, as running losses from 100 %
  const cascade = multiplicativeCascade(100, [
    { factor: 'availability', multiplier: availability },
    { factor: 'performance', multiplier: performance },
    { factor: 'quality', multiplier: quality },
  ] as const);
  const oeeValue = cascade[cascade.length - 1].remaining / 100;

  return {
    factors: {
      availability: roundTo(availability, 4),
      performance: roundTo(performance, 4),
      quality: roundTo(quality, 4),
      oee: roundTo(oeeValue, 4),
    },
    percentages: {
      availability: roundTo(availability * 100, 1),
      performance: roundTo(performance * 100, 1),
      quality: roundTo(quality * 100, 1),
      oee: roundTo(oeeValue * 100, 1),
    },
    cascade,
  };
}
