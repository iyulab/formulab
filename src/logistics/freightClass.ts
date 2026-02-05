import { roundTo } from '../utils.js';
import type { FreightClassInput, FreightClassResult } from './types.js';

/**
 * NMFC Freight Class lookup based on density (simplified)
 * Lower density = higher class = higher shipping cost
 */
const FREIGHT_CLASS_TABLE: Array<{ minDensity: number; maxDensity: number; freightClass: number; className: string }> = [
  { minDensity: 50, maxDensity: Infinity, freightClass: 50, className: 'Clean Freight' },
  { minDensity: 35, maxDensity: 50, freightClass: 55, className: 'Bricks, Cement' },
  { minDensity: 30, maxDensity: 35, freightClass: 60, className: 'Car Accessories' },
  { minDensity: 22.5, maxDensity: 30, freightClass: 65, className: 'Car Parts' },
  { minDensity: 15, maxDensity: 22.5, freightClass: 70, className: 'Food Items' },
  { minDensity: 13.5, maxDensity: 15, freightClass: 77.5, className: 'Tires, Bathroom Fixtures' },
  { minDensity: 12, maxDensity: 13.5, freightClass: 85, className: 'Crated Machinery' },
  { minDensity: 10.5, maxDensity: 12, freightClass: 92.5, className: 'Computers, Monitors' },
  { minDensity: 9, maxDensity: 10.5, freightClass: 100, className: 'Boat Covers, Car Covers' },
  { minDensity: 8, maxDensity: 9, freightClass: 110, className: 'Cabinets, Framed Art' },
  { minDensity: 7, maxDensity: 8, freightClass: 125, className: 'Small Appliances' },
  { minDensity: 6, maxDensity: 7, freightClass: 150, className: 'Auto Sheet Metal' },
  { minDensity: 5, maxDensity: 6, freightClass: 175, className: 'Clothing, Couches' },
  { minDensity: 4, maxDensity: 5, freightClass: 200, className: 'Auto Sheet Metal Parts' },
  { minDensity: 3, maxDensity: 4, freightClass: 250, className: 'Bamboo Furniture' },
  { minDensity: 2, maxDensity: 3, freightClass: 300, className: 'Wood Cabinets' },
  { minDensity: 1, maxDensity: 2, freightClass: 400, className: 'Deer Antlers' },
  { minDensity: 0, maxDensity: 1, freightClass: 500, className: 'Ping Pong Balls, Styrofoam' },
];

/**
 * Calculate NMFC Freight Class based on density
 *
 * Freight class is determined by the density of the shipment (weight per cubic foot).
 * Lower density items have higher freight classes and generally cost more to ship.
 *
 * @param input - Package weight and dimensions in imperial units
 * @returns Freight class determination results
 */
export function freightClass(input: FreightClassInput): FreightClassResult {
  const { weight, length, width, height } = input;

  // Handle zero/invalid inputs
  if (weight <= 0 || length <= 0 || width <= 0 || height <= 0) {
    return {
      density: 0,
      freightClass: 0,
      className: 'Invalid Input',
      volumeCuFt: 0,
    };
  }

  // Calculate volume in cubic feet (input is in inches)
  const volumeCuIn = length * width * height;
  const volumeCuFt = volumeCuIn / 1728; // 12^3 = 1728 cubic inches per cubic foot

  // Calculate density (lbs per cubic foot)
  const density = weight / volumeCuFt;

  // Find freight class based on density
  let fc = 500;
  let className = 'Ping Pong Balls, Styrofoam';

  for (const entry of FREIGHT_CLASS_TABLE) {
    if (density >= entry.minDensity && density < entry.maxDensity) {
      fc = entry.freightClass;
      className = entry.className;
      break;
    }
  }

  return {
    density: roundTo(density, 2),
    freightClass: fc,
    className,
    volumeCuFt: roundTo(volumeCuFt, 3),
  };
}
