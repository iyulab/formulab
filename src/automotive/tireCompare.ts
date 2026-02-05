import { roundTo } from '../utils.js';
import type { TireInput, TireResult, TireData, TireSpec } from './types.js';

// Conversion constants
const INCHES_TO_MM = 25.4;

/**
 * Calculate tire dimensions from tire specification
 *
 * Tire spec format: Width/Aspect Ratio R Rim
 * Example: 205/55R16 means 205mm width, 55% aspect ratio, 16" rim
 *
 * Formula:
 * - Sidewall height = Width x (Aspect / 100)
 * - Diameter = (Rim x 25.4) + (2 x Sidewall height)
 * - Circumference = Diameter x PI
 * - Revs per km = 1,000,000 / Circumference
 */
function calculateTireData(spec: TireSpec): TireData {
  const { width, aspect, rim } = spec;

  const sidewallHeight = width * (aspect / 100);
  const rimDiameterMm = rim * INCHES_TO_MM;
  const diameter = rimDiameterMm + (2 * sidewallHeight);
  const circumference = diameter * Math.PI;
  const revsPerKm = 1_000_000 / circumference;

  return {
    diameter: roundTo(diameter, 2),
    circumference: roundTo(circumference, 2),
    revsPerKm: roundTo(revsPerKm, 2),
  };
}

/**
 * Compare two tire sizes and calculate differences
 *
 * @param input - Two tire specifications to compare
 * @returns Comparison result with dimensions and differences
 */
export function tireCompare(input: TireInput): TireResult {
  const tire1Data = calculateTireData(input.tire1);
  const tire2Data = calculateTireData(input.tire2);

  const diameterDiff = tire2Data.diameter - tire1Data.diameter;
  const diameterDiffPercent = tire1Data.diameter > 0
    ? (diameterDiff / tire1Data.diameter) * 100
    : 0;

  // Speedometer correction: positive means speedo reads lower than actual
  // If tire2 is larger, actual speed is higher than displayed
  const speedoCorrection = -diameterDiffPercent;

  // Use || 0 to convert -0 to 0 for cleaner output
  return {
    tire1: tire1Data,
    tire2: tire2Data,
    diameterDiff: roundTo(diameterDiff, 2) || 0,
    diameterDiffPercent: roundTo(diameterDiffPercent, 2) || 0,
    speedoCorrection: roundTo(speedoCorrection, 2) || 0,
  };
}
