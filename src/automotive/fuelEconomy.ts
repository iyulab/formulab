import { roundTo } from '../utils.js';
import type { FuelInput, FuelResult } from './types.js';

// Conversion constants
const KM_PER_MILE = 1.60934;
const LITERS_PER_US_GALLON = 3.78541;
const LITERS_PER_UK_GALLON = 4.54609;

/**
 * Convert fuel economy between different units
 *
 * Units:
 * - km/L (kilometers per liter)
 * - L/100km (liters per 100 kilometers)
 * - mpg US (miles per US gallon)
 * - mpg UK (miles per UK gallon)
 *
 * @param input - Fuel economy input with value and source unit
 * @returns All fuel economy units
 */
export function fuelEconomy(input: FuelInput): FuelResult {
  const { fromUnit, value } = input;

  // Handle zero value
  if (value === 0) {
    return {
      kmPerL: 0,
      lPer100km: 0,
      mpgUS: 0,
      mpgUK: 0,
    };
  }

  let kmPerL: number;

  // Convert input to km/L as intermediate value
  switch (fromUnit) {
    case 'kmPerL':
      kmPerL = value;
      break;
    case 'lPer100km':
      // L/100km to km/L: if 10 L/100km, then 100/10 = 10 km/L
      kmPerL = 100 / value;
      break;
    case 'mpgUS':
      // mpg US to km/L: miles/gal * km/mile / L/gal = km/L
      kmPerL = (value * KM_PER_MILE) / LITERS_PER_US_GALLON;
      break;
    case 'mpgUK':
      // mpg UK to km/L: miles/gal * km/mile / L/gal = km/L
      kmPerL = (value * KM_PER_MILE) / LITERS_PER_UK_GALLON;
      break;
    default:
      kmPerL = value;
  }

  // Convert km/L to all other units
  const lPer100km = 100 / kmPerL;
  const mpgUS = (kmPerL * LITERS_PER_US_GALLON) / KM_PER_MILE;
  const mpgUK = (kmPerL * LITERS_PER_UK_GALLON) / KM_PER_MILE;

  return {
    kmPerL: roundTo(kmPerL, 2),
    lPer100km: roundTo(lPer100km, 2),
    mpgUS: roundTo(mpgUS, 2),
    mpgUK: roundTo(mpgUK, 2),
  };
}
