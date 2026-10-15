import { roundTo, requireFinite } from '../utils.js';
import type { BearingInput, BearingResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate bearing L10 life.
 * L10 = (C/P)^p x 10^6 revolutions
 * L10h = L10 / (60 x rpm) hours
 *
 * p = 3 for ball bearings
 * p = 10/3 for roller bearings
 *
 * The exponents are not free parameters: they come from the Lundberg-Palmgren fatigue
 * model and are what makes this the *basic* rating life, the life 90% of a large group
 * of apparently identical bearings reaches or exceeds. A caller wanting a modified life
 * has to apply the reliability and operating-condition factors on top; this returns the
 * unadjusted figure.
 *
 * @reference ISO 281, basic dynamic load rating and basic rating life.
 *
 * @throws RangeError if dynamicLoadRating, equivalentLoad, or rpm is not positive
 */
export function bearing(input: BearingInput): BearingResult {
  requireFinite('bearing', input);
  const { bearingType, dynamicLoadRating, equivalentLoad, rpm } = input;

  // Validate inputs
  if (dynamicLoadRating <= 0) {
    throw inputRangeError('dynamicLoadRating must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'dynamicLoadRating', exclusive_min: 0, got: dynamicLoadRating,
    });
  }
  if (equivalentLoad <= 0) {
    throw inputRangeError('equivalentLoad must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'equivalentLoad', exclusive_min: 0, got: equivalentLoad,
    });
  }
  if (rpm <= 0) {
    throw inputRangeError('rpm must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'rpm', exclusive_min: 0, got: rpm,
    });
  }

  // Life exponent: p = 3 for ball bearings, 10/3 for roller bearings
  const lifeExponent = bearingType === 'ball' ? 3 : 10 / 3;

  // L10 in million revolutions
  const loadRatio = dynamicLoadRating / equivalentLoad;
  const l10 = Math.pow(loadRatio, lifeExponent);

  // L10h in hours: L10 x 10^6 / (60 x rpm)
  const l10h = (l10 * 1_000_000) / (60 * rpm);

  return {
    l10: roundTo(l10, 2),
    l10h: roundTo(l10h, 0),
    lifeExponent: roundTo(lifeExponent, 3),
  };
}
