import type { OeeInput, OeeResult } from './types.js';

/**
 * Calculate OEE (Overall Equipment Effectiveness)
 *
 * OEE = Availability x Performance x Quality
 *
 * @param input - OEE input parameters with raw production data
 * @returns OEE result with factors (0-1) and percentages (0-100)
 */
export function oee(input: OeeInput): OeeResult {
  const { rawData } = input;
  const { plannedTime, runTime, totalCount, goodCount, idealCycleTime } = rawData;

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
      availability,
      performance,
      quality,
      oee: oeeValue,
    },
    percentages: {
      availability: availability * 100,
      performance: performance * 100,
      quality: quality * 100,
      oee: oeeValue * 100,
    },
  };
}
