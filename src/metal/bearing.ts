import type { BearingInput, BearingResult } from './types.js';

/**
 * Calculate bearing L10 life.
 * L10 = (C/P)^p x 10^6 revolutions
 * L10h = L10 / (60 x rpm) hours
 *
 * p = 3 for ball bearings
 * p = 10/3 for roller bearings
 */
export function bearing(input: BearingInput): BearingResult {
  const { bearingType, dynamicLoadRating, equivalentLoad, rpm } = input;

  // Validate inputs
  if (dynamicLoadRating <= 0 || equivalentLoad <= 0 || rpm <= 0) {
    return { l10: 0, l10h: 0, lifeExponent: 0 };
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

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
