import { roundTo, requireFinite } from '../utils.js';
import type { RadialChipThinningInput, RadialChipThinningResult } from './types.js';

/**
 * Calculate adjusted feed per tooth to compensate for radial chip thinning.
 *
 * When ae < D/2, the actual chip thickness is less than the programmed fz.
 * This function computes the adjusted (higher) fz needed to maintain the target chip load.
 *
 * @formula
 *   chipThinningFactor = D / (2 × √(ae × (D − ae)))
 *   adjustedFz = fz_target × chipThinningFactor
 *
 * @reference Harvey Tool — Radial Chip Thinning guide.
 *
 * @param input - Chip thinning parameters
 * @returns RadialChipThinningResult with adjusted feed and thinning factor
 * @throws RangeError if toolDiameter is not greater than 0, radialDepthOfCut is not in (0, toolDiameter),
 *   or chipLoadTarget is not greater than 0
 */
export function radialChipThinning(input: RadialChipThinningInput): RadialChipThinningResult {
  requireFinite('radialChipThinning', input);
  const { toolDiameter, radialDepthOfCut, chipLoadTarget } = input;

  // The thinning factor divides by sqrt(ae x (D - ae)); outside 0 < ae < D that radicand
  // is zero or negative, which is a cut the geometry does not describe rather than an
  // infinitely thinned chip.
  if (!(toolDiameter > 0)) {
    throw new RangeError('toolDiameter must be greater than 0');
  }
  if (!(radialDepthOfCut > 0) || radialDepthOfCut >= toolDiameter) {
    throw new RangeError('radialDepthOfCut must be greater than 0 and less than toolDiameter');
  }
  if (!(chipLoadTarget > 0)) {
    throw new RangeError('chipLoadTarget must be greater than 0');
  }

  const D = toolDiameter;
  const ae = radialDepthOfCut;

  // Factor = D / (2 × √(ae × (D - ae)))
  const factor = D / (2 * Math.sqrt(ae * (D - ae)));
  const adjustedFz = chipLoadTarget * factor;

  return {
    adjustedFeedPerTooth: roundTo(adjustedFz, 4),
    chipThinningFactor: roundTo(factor, 4),
    effectiveChipLoad: roundTo(chipLoadTarget, 4),
  };
}
