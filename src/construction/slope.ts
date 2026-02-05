import type { SlopeInput, SlopeResult } from './types.js';

/**
 * Convert slope between different units
 *
 * Slope can be expressed as:
 * - Percent: rise/run × 100 (e.g., 10% = 10m rise per 100m run)
 * - Degrees: angle from horizontal (e.g., 45° = 100% slope)
 * - Ratio: 1:N where N is run per 1 unit rise (e.g., 1:10 = 10% slope)
 *
 * @param input - Slope value and its unit
 * @returns Slope in all units
 */
export function slope(input: SlopeInput): SlopeResult {
  const { fromUnit, value } = input;

  // Handle zero value
  if (value === 0) {
    return {
      percent: 0,
      degrees: 0,
      ratio: 0,
      risePerMeter: 0,
    };
  }

  let percent: number;

  // Convert input to percent as base unit
  switch (fromUnit) {
    case 'percent':
      percent = value;
      break;
    case 'degrees':
      // tan(angle) = rise/run = percent/100
      percent = Math.tan((value * Math.PI) / 180) * 100;
      break;
    case 'ratio':
      // ratio is 1:N, so percent = 100/N
      percent = value > 0 ? 100 / value : 0;
      break;
    default:
      percent = 0;
  }

  // Convert from percent to other units
  // Degrees: arctan(percent/100)
  const degrees = Math.atan(percent / 100) * (180 / Math.PI);

  // Ratio: 1:N where N = 100/percent
  const ratio = percent > 0 ? 100 / percent : 0;

  // Rise per meter: percent × 10 (mm per 1m horizontal run)
  const risePerMeter = percent * 10;

  return {
    percent,
    degrees,
    ratio,
    risePerMeter,
  };
}
