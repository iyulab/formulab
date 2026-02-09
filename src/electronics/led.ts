import type { LedResistorInput, LedResistorResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Round to specified decimal places
 */

// E24 standard resistor series (5% tolerance)
const E24_SERIES = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0,
  3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];

/**
 * Find the nearest standard E24 resistor value
 */
function findNearestStandardResistor(resistance: number): number {
  if (resistance <= 0) return 10; // Minimum practical value

  // Find the decade (power of 10)
  const decade = Math.floor(Math.log10(resistance));
  const normalized = resistance / Math.pow(10, decade);

  // Find nearest E24 value
  let nearestValue = E24_SERIES[0];
  let minDiff = Math.abs(normalized - E24_SERIES[0]);

  for (const value of E24_SERIES) {
    const diff = Math.abs(normalized - value);
    if (diff < minDiff) {
      minDiff = diff;
      nearestValue = value;
    }
  }

  // Also check the next decade up (e.g., 1.0 * 10^(n+1))
  const nextDecadeValue = E24_SERIES[0] * Math.pow(10, decade + 1);
  if (Math.abs(resistance - nextDecadeValue) < Math.abs(resistance - nearestValue * Math.pow(10, decade))) {
    return nextDecadeValue;
  }

  return roundTo(nearestValue * Math.pow(10, decade), 1);
}

/**
 * Calculate LED current limiting resistor
 * @param input - Supply voltage, LED forward voltage, and desired current
 * @returns Resistance value and related calculations
 * @throws Error if supply voltage <= forward voltage or current <= 0
 */
export function ledResistor(input: LedResistorInput): LedResistorResult {
  const { supplyVoltage, forwardVoltage, forwardCurrent } = input;

  // Validate inputs
  if (supplyVoltage <= forwardVoltage) {
    throw new RangeError('Supply voltage must be greater than forward voltage');
  }
  if (forwardCurrent <= 0) {
    throw new RangeError('Forward current must be positive');
  }

  // R = (Vs - Vf) / If
  // Note: forwardCurrent is in mA, so convert to A for calculation
  const forwardCurrentAmps = forwardCurrent / 1000;
  const resistance = (supplyVoltage - forwardVoltage) / forwardCurrentAmps;

  // Find nearest standard resistor value
  const standardResistance = findNearestStandardResistor(resistance);

  // Calculate power dissipation: P = If^2 * R (in milliwatts)
  // Using the actual calculated resistance
  const powerDissipation = roundTo(forwardCurrentAmps * forwardCurrentAmps * resistance * 1000, 2);

  // Calculate actual current with standard resistor
  const actualCurrent = roundTo((supplyVoltage - forwardVoltage) / standardResistance * 1000, 2);

  return {
    resistance: roundTo(resistance, 2),
    standardResistance,
    powerDissipation,
    actualCurrent,
  };
}
