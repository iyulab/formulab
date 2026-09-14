import { roundTo } from '../utils.js';
import type { ShelfLifeInput, ShelfLifeResult } from './types.js';

/**
 * Estimate shelf life at different storage temperatures using Q10 rule.
 *
 * The Q10 rule states that reaction rate doubles (or increases by Q10 factor)
 * for every 10 degree C increase in temperature.
 *
 * Acceleration Factor = Q10 ^ ((refTemp - targetTemp) / 10)
 * Estimated Shelf Life = shelfLifeAtRef * accelerationFactor
 *
 * @param input - Shelf life input with reference values and Q10 factor
 * @returns Estimated shelf life at target temperature
 * @throws RangeError if q10 is not greater than 0
 */
export function shelfLife(input: ShelfLifeInput): ShelfLifeResult {
  const { shelfLifeAtRef, refTemp, targetTemp, q10 } = input;

  // Q10 is raised to a possibly negative or fractional power.
  if (!(q10 > 0)) {
    throw new RangeError('q10 must be greater than 0');
  }

  const tempDifference = refTemp - targetTemp;

  // Acceleration factor: Q10 ^ (deltaT / 10)
  // If target is colder, factor > 1 (longer shelf life)
  // If target is warmer, factor < 1 (shorter shelf life)
  const accelerationFactor = Math.pow(q10, tempDifference / 10);

  const estimatedShelfLife = shelfLifeAtRef * accelerationFactor;

  return {
    estimatedShelfLife: roundTo(estimatedShelfLife, 4),
    accelerationFactor: roundTo(accelerationFactor, 4),
    refTemp,
    targetTemp,
    tempDifference,
  };
}
