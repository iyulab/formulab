import { roundTo } from '../utils.js';
import type { OeeInput, OeeResult } from './types.js';

/**
 * Calculate OEE (Overall Equipment Effectiveness)
 *
 * OEE = Availability x Performance x Quality
 *
 * @param input - OEE input parameters with raw production data
 * @returns OEE result with factors (0-1) and percentages (0-100)
 * @throws Error if goodCount > totalCount
 */
export function oee(input: OeeInput): OeeResult {
  const { rawData } = input;
  const { plannedTime, runTime, totalCount, goodCount, idealCycleTime } = rawData;

  // Validate: goodCount cannot exceed totalCount
  if (goodCount > totalCount) {
    throw new Error(
      `Invalid input: goodCount (${goodCount}) cannot exceed totalCount (${totalCount})`
    );
  }

  // Validate: no negative values allowed
  if (goodCount < 0) {
    throw new Error(`Invalid input: goodCount (${goodCount}) cannot be negative`);
  }

  // Handle edge cases - return zeros for invalid inputs
  if (plannedTime <= 0 || runTime <= 0 || idealCycleTime <= 0 || totalCount < 0) {
    return {
      factors: { availability: 0, performance: 0, quality: 0, oee: 0 },
      percentages: { availability: 0, performance: 0, quality: 0, oee: 0 },
    };
  }

  // Availability = Run Time / Planned Time
  const availability = runTime / plannedTime;

  // Performance = (Ideal Cycle Time x Total Count) / Run Time
  // Note: idealCycleTime is in minutes, runTime is in minutes
  const performance = (idealCycleTime * totalCount) / runTime;

  // Quality = Good Count / Total Count
  const quality = totalCount > 0 ? goodCount / totalCount : 0;

  // OEE = Availability x Performance x Quality
  const oeeValue = availability * performance * quality;

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
  };
}
