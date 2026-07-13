import { roundTo } from '../utils.js';
import type { ProductCarbonFootprintInput, ProductCarbonFootprintResult } from './types.js';

/**
 * Calculate product carbon footprint across lifecycle stages
 *
 * @formula total = Σ stages, perUnit = total / quantity
 * @reference ISO 14067, PAS 2050
 * @param input - Lifecycle stages with CO2 and production quantity
 * @returns Total and per-unit carbon footprint with stage breakdown. Negative stage
 *   values are valid (end-of-life recycling credits). When the total is ≤ 0 the stage
 *   percentages are reported as 0 (valid-but-degenerate; a share of a non-positive
 *   total is not meaningful).
 * @throws {RangeError} empty stages, or productionQuantity ≤ 0
 */
export function productCarbonFootprint(input: ProductCarbonFootprintInput): ProductCarbonFootprintResult {
  const { stages, productionQuantity } = input;

  if (!stages || stages.length === 0) {
    throw new RangeError('stages must contain at least one lifecycle stage');
  }
  if (productionQuantity <= 0) {
    throw new RangeError('productionQuantity must be greater than 0');
  }

  const totalCo2Kg = roundTo(
    stages.reduce((sum, s) => sum + s.co2Kg, 0),
    2,
  );
  const perUnitCo2Kg = roundTo(totalCo2Kg / productionQuantity, 4);

  const stageBreakdown = stages.map(s => ({
    name: s.name,
    co2Kg: roundTo(s.co2Kg, 2),
    // totalCo2Kg ≤ 0 (zero stages, or credits outweighing emissions) — report 0%, not NaN
    // or a misleading share of a negative total
    percent: totalCo2Kg > 0 ? roundTo((s.co2Kg / totalCo2Kg) * 100, 1) : 0,
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
