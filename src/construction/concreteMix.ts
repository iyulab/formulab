import type { ConcreteGrade, ConcreteInput, ConcreteResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Concrete mix design data by grade
 * Based on standard mix design proportions
 */
interface MixDesign {
  cementPerM3: number;  // kg cement per m³
  sandRatio: number;    // sand ratio relative to cement
  gravelRatio: number;  // gravel ratio relative to cement
  wcRatio: number;      // water-cement ratio
  ratioString: string;  // display ratio string
}

const MIX_DESIGNS: Record<ConcreteGrade, MixDesign> = {
  '15': { cementPerM3: 280, sandRatio: 2, gravelRatio: 4, wcRatio: 0.60, ratioString: '1 : 2 : 4' },
  '20': { cementPerM3: 330, sandRatio: 1.5, gravelRatio: 3, wcRatio: 0.55, ratioString: '1 : 1.5 : 3' },
  '25': { cementPerM3: 370, sandRatio: 1, gravelRatio: 2, wcRatio: 0.50, ratioString: '1 : 1 : 2' },
  '30': { cementPerM3: 400, sandRatio: 1, gravelRatio: 2, wcRatio: 0.45, ratioString: '1 : 1 : 2' },
  '35': { cementPerM3: 430, sandRatio: 1, gravelRatio: 1.5, wcRatio: 0.42, ratioString: '1 : 1 : 1.5' },
  '40': { cementPerM3: 460, sandRatio: 1, gravelRatio: 1.5, wcRatio: 0.40, ratioString: '1 : 1 : 1.5' },
};

/**
 * Calculate concrete mix design quantities
 *
 * @param input - Concrete grade and volume
 * @returns Material quantities in kg (cement, sand, gravel) and liters (water)
 */
export function concreteMix(input: ConcreteInput): ConcreteResult {
  const { grade, volume } = input;
  const design = MIX_DESIGNS[grade];

  const cement = roundTo(design.cementPerM3 * volume, 2);
  const sand = roundTo(cement * design.sandRatio, 2);
  const gravel = roundTo(cement * design.gravelRatio, 2);
  const water = roundTo(cement * design.wcRatio, 2);

  return {
    cement,
    sand,
    gravel,
    water,
    ratio: design.ratioString,
  };
}
