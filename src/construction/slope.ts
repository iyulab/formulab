import type { SlopeInput, SlopeResult } from './types.js';
import { requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';

/**
 * Convert slope between different units
 *
 * Slope can be expressed as:
 * - Percent: rise/run × 100 (e.g., 10% = 10m rise per 100m run)
 * - Degrees: angle from horizontal (e.g., 45° = 100% slope)
 * - Ratio: 1:N where N is run per 1 unit rise (e.g., 1:10 = 10% slope). N is a magnitude: a
 *   downhill −10% grade is also 1:10, its direction carried by the signed percent and degrees.
 *   Flat ground has no 1:N form, so `ratio` is null there.
 *
 * @param input - Slope value and its unit
 * @returns Slope in all units
 * @throws RangeError if the value is not finite, a ratio is ≤ 0, or a degree value is not strictly
 *   between −90 and 90 (tan diverges at ±90°: a 95° input would otherwise read back as −85°)
 */
export function slope(input: SlopeInput): SlopeResult {
  requireFinite('slope', input);
  const { fromUnit, value } = input;

  // A ratio of 1:N with N <= 0 is vertical/undefined, not flat ground.
  // (percent/degrees value 0 is legitimately flat and returns zeros below.)
  if (!Number.isFinite(value)) {
    throw inputRangeError('value must be a finite number', {
      code: 'value_not_finite', parameter: 'value', got: typeof value === 'number' ? value : String(value),
    });
  }
  if (fromUnit === 'ratio' && value <= 0) {
    throw inputRangeError('ratio value must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'value', exclusive_min: 0, got: value,
    });
  }
  if (fromUnit === 'degrees' && !(value > -90 && value < 90)) {
    throw inputRangeError('degrees must be between -90 and 90 (exclusive)', {
      code: 'parameter_out_of_range', parameter: 'value', exclusive_min: -90, exclusive_max: 90, got: value,
    });
  }

  // Handle zero value (flat ground for percent/degrees): no rise, so no 1:N
  if (value === 0) {
    return {
      percent: 0,
      degrees: 0,
      ratio: null,
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

  // Ratio: 1:N where N = 100/|percent| — the same N uphill and downhill
  const ratio = percent !== 0 ? 100 / Math.abs(percent) : null;

  // Rise per meter: percent × 10 (mm per 1m horizontal run)
  const risePerMeter = percent * 10;

  return {
    percent,
    degrees,
    ratio,
    risePerMeter,
  };
}
