import { roundTo, requireFinite } from '../utils.js';
import type { ProductCarbonFootprintInput, ProductCarbonFootprintResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate product carbon footprint across lifecycle stages
 *
 * @formula total = Σ stages, perUnit = total / quantity
 * @reference ISO 14067, PAS 2050
 * @param input - Lifecycle stages with CO2 and production quantity
 * @returns Total and per-unit carbon footprint with stage breakdown. Negative stage
 *   values are valid (end-of-life recycling credits). When the total is ≤ 0 the stage
 *   percentages are `null` (a share of a non-positive total is not meaningful).
 * @throws {RangeError} empty stages, or productionQuantity is not greater than 0 (NaN included).
 *   Negative stage values are not refused — they are this model's recycling credits.
 */
export function productCarbonFootprint(input: ProductCarbonFootprintInput): ProductCarbonFootprintResult {
  requireFinite('productCarbonFootprint', input);
  const { stages, productionQuantity } = input;

  if (!stages || stages.length === 0) {
    throw inputRangeError('stages must contain at least one lifecycle stage', { code: 'empty_input', parameter: 'stages' });
  }
  if (!(productionQuantity > 0)) {
    throw inputRangeError('productionQuantity must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'productionQuantity', exclusive_min: 0, got: productionQuantity,
    });
  }

  const totalCo2Kg = roundTo(
    stages.reduce((sum, s) => sum + s.co2Kg, 0),
    2,
  );
  const perUnitCo2Kg = roundTo(totalCo2Kg / productionQuantity, 4);

  const stageBreakdown = stages.map(s => ({
    name: s.name,
    co2Kg: roundTo(s.co2Kg, 2),
    // totalCo2Kg ≤ 0 (all stages zero, or credits outweighing emissions) has no share to
    // report — null, not a 0 % that reads as «this stage emits nothing»
    percent: totalCo2Kg > 0 ? roundTo((s.co2Kg / totalCo2Kg) * 100, 1) : null,
  }));

  let dominantStage = stages[0].name;
  let maxCo2 = stages[0].co2Kg;
  for (const s of stages) {
    if (s.co2Kg > maxCo2) {
      maxCo2 = s.co2Kg;
      dominantStage = s.name;
    }
  }

  return { totalCo2Kg, perUnitCo2Kg, stageBreakdown, dominantStage };
}
