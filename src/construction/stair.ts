import type { StairInput, StairResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Riser heights used when the caller asks for auto-calculation, in millimetres.
 *
 * These are comfort figures in common use, not limits taken from a building code, and
 * they are deliberately narrower than any code band: model codes permit risers well
 * below 150mm and above 180mm. Nothing here decides code compliance, and a result
 * produced from these values must not be presented as a code check — the applicable
 * limits depend on jurisdiction and on whether the stair is residential or commercial.
 *
 * They only steer the riser count when `riserHeight` is 0 ("auto"); an explicit
 * `riserHeight` is used as given.
 */
const MIN_RISER = 150;
const MAX_RISER = 180;
const DEFAULT_RISER = 170;

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
 * @throws {RangeError} totalRise ≤ 0, totalRun < 0, or riserHeight < 0 (riserHeight 0
 *   means "auto-calculate", the established contract)
 */
export function stair(input: StairInput): StairResult {
  const { totalRise, totalRun, riserHeight } = input;

  if (totalRise <= 0) {
    throw new RangeError('totalRise must be greater than 0');
  }
  if (totalRun < 0) {
    throw new RangeError('totalRun must not be negative');
  }
  if (riserHeight !== undefined && riserHeight < 0) {
    // riserHeight 0 is the established "auto-calculate" sentinel; negative is invalid
    throw new RangeError('riserHeight must not be negative');
  }

  let numberOfRisers: number;
  let actualRiserHeight: number;

  if (riserHeight && riserHeight > 0) {
    // Use specified riser height; at least one riser even when riserHeight > 2×totalRise
    // (rounding to 0 would divide by zero)
    numberOfRisers = Math.max(1, Math.round(totalRise / riserHeight));
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
