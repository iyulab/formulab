import type { RoofInput, RoofResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Get pitch description based on rise per 12 units
 */
function getPitchDescription(risePerTwelve: number): string {
  if (risePerTwelve < 2) return 'flat';
  if (risePerTwelve < 4) return 'low';
  if (risePerTwelve < 9) return 'conventional';
  if (risePerTwelve < 18) return 'steep';
  return 'extreme';
}

/**
 * Calculate roof slope, rafter length, and roof area
 *
 * Formulas:
 * - Slope (degrees) = atan(rise / run) × (180 / π)
 * - Slope (percent) = (rise / run) × 100
 * - Rafter length = sqrt(rise² + run²)
 * - Slope factor = sqrt(1 + (rise/run)²)
 * - Roof area = footprint area × slope factor
 *
 * @param input - Roof input parameters
 * @returns Roof calculation results
 */
export function roof(input: RoofInput): RoofResult {
  const { rise, run, footprintLength, footprintWidth } = input;

  // Validate inputs
  if (run <= 0) {
    throw new RangeError('Run must be greater than zero');
  }
  if (rise < 0) {
    throw new RangeError('Rise must be non-negative');
  }

  // Calculate slope ratio (normalized to 12-unit run for pitch notation)
  const risePerTwelve = (rise / run) * 12;
  const slopeRatio = `${roundTo(risePerTwelve, 1)}:12`;

  // Calculate slope in degrees
  const slopeRadians = Math.atan(rise / run);
  const slopeDegrees = roundTo(slopeRadians * (180 / Math.PI), 2);

  // Calculate slope as percentage
  const slopePercent = roundTo((rise / run) * 100, 2);

  // Calculate rafter length (hypotenuse)
  const rafterLength = roundTo(Math.sqrt(rise * rise + run * run), 3);

  // Calculate slope factor (multiplier for roof area)
  const slopeFactor = roundTo(Math.sqrt(1 + Math.pow(rise / run, 2)), 4);

  // Calculate roof area
  const footprintArea = footprintLength * footprintWidth;
  const roofArea = roundTo(footprintArea * slopeFactor, 2);

  // Determine pitch description based on slope
  const pitchDescription = getPitchDescription(risePerTwelve);

  return {
    slopeRatio,
    slopeDegrees,
    slopePercent,
    rafterLength,
    slopeFactor,
    roofArea,
    pitchDescription,
  };
}
