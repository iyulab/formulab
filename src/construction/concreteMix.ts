import type { ConcreteGrade, ConcreteInput, ConcreteResult } from './types.js';
import { roundTo, requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';

interface MixDesign {
  cementPerM3: number;  // kg cement per m³
  sandRatio: number;    // sand ratio relative to cement
  gravelRatio: number;  // gravel ratio relative to cement
  wcRatio: number;      // water-cement ratio
}

/**
 * Concrete mix proportions by grade.
 *
 * These are conventional nominal proportions and cement contents in common use; no
 * normative source is attached to them, and in particular the higher grades are not
 * taken from a standard's nominal-mix table — above the lower grades, codes generally
 * call for a designed mix proven by trial batches rather than a fixed ratio. Treat the
 * figures as a starting point for estimating quantities, not as a specified mix.
 */
const MIX_DESIGNS: Record<ConcreteGrade, MixDesign> = {
  '15': { cementPerM3: 280, sandRatio: 2, gravelRatio: 4, wcRatio: 0.60 },
  '20': { cementPerM3: 330, sandRatio: 1.5, gravelRatio: 3, wcRatio: 0.55 },
  '25': { cementPerM3: 370, sandRatio: 1, gravelRatio: 2, wcRatio: 0.50 },
  '30': { cementPerM3: 400, sandRatio: 1, gravelRatio: 2, wcRatio: 0.45 },
  '35': { cementPerM3: 430, sandRatio: 1, gravelRatio: 1.5, wcRatio: 0.42 },
  '40': { cementPerM3: 460, sandRatio: 1, gravelRatio: 1.5, wcRatio: 0.40 },
};

/**
 * Calculate concrete mix design quantities
 *
 * @param input - Concrete grade and volume
 * @returns Material quantities in kg (cement, sand, gravel) and liters (water)
 * @throws {RangeError} unknown grade, or volume ≤ 0
 */
export function concreteMix(input: ConcreteInput): ConcreteResult {
  requireFinite('concreteMix', input);
  const { grade, volume } = input;
  const design = MIX_DESIGNS[grade];
  if (design === undefined) {
    throw inputRangeError(`unknown concrete grade: ${String(grade)}`, {
      code: 'unknown_option', parameter: 'grade', got: String(grade),
    });
  }
  if (volume <= 0) {
    throw inputRangeError('volume must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'volume', exclusive_min: 0, got: volume,
    });
  }

  const cement = roundTo(design.cementPerM3 * volume, 2);
  const sand = roundTo(cement * design.sandRatio, 2);
  const gravel = roundTo(cement * design.gravelRatio, 2);
  const water = roundTo(cement * design.wcRatio, 2);

  return {
    cement,
    sand,
    gravel,
    water,
    ratio: { cement: 1, sand: design.sandRatio, gravel: design.gravelRatio },
  };
}
