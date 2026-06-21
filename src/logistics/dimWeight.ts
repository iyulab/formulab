import { roundTo } from '../utils.js';
import type { DimWeightInput, DimWeightResult, CarrierType } from './types.js';

// DIM factors (cubic inches per pound, converted to cubic cm per kg)
// Standard industry factors:
// - Domestic Air: 139 in³/lb = 139 * 16.387 / 0.4536 ≈ 5000 cm³/kg
// - International Air: 166 in³/lb = 166 * 16.387 / 0.4536 ≈ 6000 cm³/kg
// - Ground: 139 in³/lb = 5000 cm³/kg (same as domestic air)
const DIM_FACTORS: Record<CarrierType, number> = {
  domestic_air: 5000,
  international_air: 6000,
  ground: 5000,
};

/**
 * Calculate Dimensional Weight for shipping
 *
 * Dimensional weight (volumetric weight) is used by carriers to charge
 * for lightweight but bulky packages. The billable weight is the greater
 * of actual weight or dimensional weight.
 *
 * @param input - Package dimensions and weight
 * @returns Dimensional weight calculation results
 */
export function dimWeight(input: DimWeightInput): DimWeightResult {
  const { length, width, height, actualWeight, carrier } = input;

  if (length <= 0) throw new RangeError('length must be greater than 0');
  if (width <= 0) throw new RangeError('width must be greater than 0');
  if (height <= 0) throw new RangeError('height must be greater than 0');
  if (actualWeight < 0) throw new RangeError('actualWeight must not be negative');

  const dimFactor = DIM_FACTORS[carrier];

  // Dimensional weight = (L × W × H) / DIM factor
  // Input is in cm, output in kg
  const volumeCm3 = length * width * height;
  const dimensionalWeight = roundTo(volumeCm3 / dimFactor, 2);
  const actualWeightRounded = roundTo(actualWeight, 2);

  // Billable weight = max(actual weight, dimensional weight)
  const billableWeight = Math.max(actualWeightRounded, dimensionalWeight);

  return {
    dimensionalWeight,
    actualWeight: actualWeightRounded,
    billableWeight: roundTo(billableWeight, 2),
    dimFactor,
    isDimWeightHigher: dimensionalWeight > actualWeightRounded,
  };
}
