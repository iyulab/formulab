import { roundTo } from '../utils.js';
import type { CbmInput, CbmResult } from './types.js';

/**
 * Convert length to meters based on unit
 */
function toMeters(value: number, unit: 'mm' | 'cm' | 'm'): number {
  switch (unit) {
    case 'mm': return value / 1000;
    case 'cm': return value / 100;
    case 'm': return value;
    default: return value;
  }
}

/**
 * Calculate Cubic Meter (CBM) for shipping cargo
 *
 * @formula CBM = Length × Width × Height (all converted to meters)
 *   - Total CBM = CBM per unit × Quantity
 *
 * @reference Physical volume formula (L × W × H).
 * @reference Industry standard: 20ft container internal ≈ 33.2 m³, 40ft ≈ 67.7 m³.
 *
 * @units input: mm, cm, or m; output: m³
 *
 * @param input - Cargo dimensions and quantity
 * @returns CBM per unit and total CBM
 */
export function cbm(input: CbmInput): CbmResult {
  const { length, width, height, quantity, unit } = input;

  // Convert dimensions to meters
  const lengthM = toMeters(length, unit);
  const widthM = toMeters(width, unit);
  const heightM = toMeters(height, unit);

  // Calculate CBM per unit
  const cbmPerUnit = lengthM * widthM * heightM;

  // Calculate total CBM
  const totalCbm = cbmPerUnit * quantity;

  return {
    cbmPerUnit: roundTo(cbmPerUnit, 6),
    totalCbm: roundTo(totalCbm, 6),
  };
}
