import type { StairInput, StairResult } from './types.js';
import { roundTo } from '../utils.js';

// Default comfortable riser height range: 150-180mm
const MIN_RISER = 150;
const MAX_RISER = 180;
const DEFAULT_RISER = 170; // Target riser height for auto-calculation

/**
 * Calculate stair dimensions
 *
 * Formulas:
 * - Number of risers = totalRise / riserHeight (rounded)
 * - Number of treads = risers - 1
 * - Tread depth = totalRun / numberOfTreads
 * - Stringer length = sqrt(totalRise² + totalRun²)
 * - 2R + T comfort formula (should be 600-650mm for comfortable stairs)
 * - Total angle = atan2(totalRise, totalRun) × (180 / π)
 *
 * @param input - Stair input parameters
 * @returns Stair calculation results
 */
export function stair(input: StairInput): StairResult {
  const { totalRise, totalRun, riserHeight } = input;

  let numberOfRisers: number;
  let actualRiserHeight: number;

  if (riserHeight && riserHeight > 0) {
    // Use specified riser height
    numberOfRisers = Math.round(totalRise / riserHeight);
    actualRiserHeight = totalRise / numberOfRisers;
  } else {
    // Auto-calculate optimal riser count based on target riser height
    numberOfRisers = Math.round(totalRise / DEFAULT_RISER);
    if (numberOfRisers < 1) numberOfRisers = 1;
    actualRiserHeight = totalRise / numberOfRisers;

    // Adjust if outside comfortable range
    if (actualRiserHeight > MAX_RISER) {
      numberOfRisers = Math.ceil(totalRise / MAX_RISER);
      actualRiserHeight = totalRise / numberOfRisers;
    } else if (actualRiserHeight < MIN_RISER && numberOfRisers > 1) {
      numberOfRisers = Math.floor(totalRise / MIN_RISER);
      if (numberOfRisers < 1) numberOfRisers = 1;
      actualRiserHeight = totalRise / numberOfRisers;
    }
  }

  // Number of treads = risers - 1 (bottom step is floor level)
  const numberOfTreads = numberOfRisers - 1;

  // Tread depth = total run / number of treads
  const treadDepth = numberOfTreads > 0 ? totalRun / numberOfTreads : 0;

  // Stringer length = sqrt(totalRise² + totalRun²)
  const stringerLength = Math.sqrt(totalRise * totalRise + totalRun * totalRun);

  // 2R + T comfort formula (should be 600-650mm for comfortable stairs)
  const twoRPlusT = 2 * actualRiserHeight + treadDepth;
  const codeCompliant = twoRPlusT >= 600 && twoRPlusT <= 650;

  // Calculate stair angle
  const totalAngle = Math.atan2(totalRise, totalRun) * (180 / Math.PI);

  return {
    numberOfRisers,
    numberOfTreads,
    actualRiserHeight: roundTo(actualRiserHeight, 1),
    treadDepth: roundTo(treadDepth, 1),
    stringerLength: roundTo(stringerLength, 1),
    twoRPlusT: roundTo(twoRPlusT, 1),
    codeCompliant,
    totalAngle: roundTo(totalAngle, 1),
  };
}
