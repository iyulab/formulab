import { roundTo } from '../utils.js';
import type { EffectiveDiameterInput, EffectiveDiameterResult } from './types.js';

/**
 * Calculate the effective cutting diameter of a ball end mill at a given depth of cut.
 *
 * @formula
 *   Deff = 2 × √(ap × (D − ap))   for ap ≤ D/2
 *   Deff = D                       for ap > D/2 (cut reaches the cylindrical shank)
 *   rpmCorrectionFactor = D / Deff
 *   effectiveRpm = (Vc × 1000) / (π × Deff)   when cuttingSpeed (Vc) is provided
 *
 * The effective diameter determines the actual cutting speed at the depth of cut,
 * which is smaller than the nominal diameter unless cutting at or beyond the equator.
 * Multiply the nominal spindle RPM by `rpmCorrectionFactor` to restore the programmed
 * surface speed at the engaged diameter.
 *
 * @reference Sandvik Coromant — Ball nose end mill effective cutting diameter.
 *
 * @units toolDiameter, axialDepthOfCut: mm; cuttingSpeed: m/min; effectiveRpm: RPM
 * @validation toolDiameter > 0; 0 < axialDepthOfCut ≤ toolDiameter; cuttingSpeed > 0 when provided
 * @throws RangeError when toolDiameter ≤ 0, axialDepthOfCut is outside (0, toolDiameter], or cuttingSpeed ≤ 0
 *
 * @param input - Effective diameter parameters
 * @returns EffectiveDiameterResult with effective diameter, RPM correction factor, and effective RPM when Vc is given
 */
export function effectiveDiameter(input: EffectiveDiameterInput): EffectiveDiameterResult {
  const { toolDiameter, axialDepthOfCut, cuttingSpeed } = input;

  if (toolDiameter <= 0) {
    throw new RangeError(`toolDiameter must be > 0, got ${toolDiameter}`);
  }
  if (axialDepthOfCut <= 0) {
    throw new RangeError(`axialDepthOfCut must be > 0, got ${axialDepthOfCut}`);
  }
  if (axialDepthOfCut > toolDiameter) {
    throw new RangeError(
      `axialDepthOfCut must not exceed toolDiameter (${axialDepthOfCut} > ${toolDiameter})`,
    );
  }
  if (cuttingSpeed !== undefined && cuttingSpeed <= 0) {
    throw new RangeError(`cuttingSpeed must be > 0 when provided, got ${cuttingSpeed}`);
  }

  // Beyond the equator the ball section is fully engaged and Deff equals the nominal diameter.
  const dEff = axialDepthOfCut >= toolDiameter / 2
    ? toolDiameter
    : 2 * Math.sqrt(axialDepthOfCut * (toolDiameter - axialDepthOfCut));

  const result: EffectiveDiameterResult = {
    effectiveDiameter: roundTo(dEff, 4),
    rpmCorrectionFactor: roundTo(toolDiameter / dEff, 4),
  };

  if (cuttingSpeed !== undefined) {
    result.effectiveRpm = roundTo((cuttingSpeed * 1000) / (Math.PI * dEff), 1);
  }

  return result;
}
