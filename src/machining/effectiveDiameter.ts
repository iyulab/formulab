import { roundTo } from '../utils.js';
import type { EffectiveDiameterInput, EffectiveDiameterResult } from './types.js';

/**
 * Calculate the effective cutting diameter of a ball end mill at a given depth of cut.
 *
 * @formula
 *   Deff = 2 × √(ap × (D − ap))
 *
 * The effective diameter determines the actual cutting speed at the depth of cut,
 * which is smaller than the nominal diameter unless cutting at the equator.
 *
 * @reference Sandvik Coromant — Ball nose end mill effective cutting diameter.
 *
 * @param input - Effective diameter parameters
 * @returns EffectiveDiameterResult with effective diameter
 */
export function effectiveDiameter(input: EffectiveDiameterInput): EffectiveDiameterResult {
  const { toolDiameter, axialDepthOfCut } = input;

  const dEff = 2 * Math.sqrt(axialDepthOfCut * (toolDiameter - axialDepthOfCut));

  return {
    effectiveDiameter: roundTo(dEff, 4),
    effectiveRpm: 0, // placeholder — requires cuttingSpeed input to compute
  };
}
