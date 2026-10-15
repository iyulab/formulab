import { roundTo, requireFinite } from '../utils.js';
import type { CbmInput, CbmResult } from './types.js';
import { InputRangeError } from '../errors.js';

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
 * @throws {RangeError} length, width, height or quantity is not greater than 0
 */
export function cbm(input: CbmInput): CbmResult {
  requireFinite('cbm', input);
  const { length, width, height, quantity, unit } = input;

  // A negative dimension or quantity flips the sign of the volume; a zero one is no cargo.
  if (!(length > 0)) {
    throw new InputRangeError('length must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'length', exclusive_min: 0, got: length,
    });
  }
  if (!(width > 0)) {
    throw new InputRangeError('width must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'width', exclusive_min: 0, got: width,
    });
  }
  if (!(height > 0)) {
    throw new InputRangeError('height must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'height', exclusive_min: 0, got: height,
    });
  }
  if (!(quantity > 0)) {
    throw new InputRangeError('quantity must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'quantity', exclusive_min: 0, got: quantity,
    });
  }

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
