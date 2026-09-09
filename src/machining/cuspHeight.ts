import { roundTo } from '../utils.js';
import type { CuspHeightInput, CuspHeightResult } from './types.js';

/**
 * Calculate the scallop (cusp) height for ball end mill surface finishing.
 *
 * @formula
 *   h = r − √(r² − (stepover/2)²)
 *   Ra ≈ h / 4 (approximate)
 *
 * @reference Oberg, E. et al. "Machinery's Handbook", 31st Ed. — Ball-nose milling.
 *
 * @param input - Cusp height parameters
 * @returns CuspHeightResult with scallop height and approximate Ra
 * @throws RangeError if toolRadius or stepover is not positive, or if stepover exceeds the
 *   tool diameter (adjacent passes never meet, so the formula has no scallop to describe —
 *   without the guard the square root goes negative and the result is silently NaN)
 */
export function cuspHeight(input: CuspHeightInput): CuspHeightResult {
  const { toolRadius, stepover } = input;

  if (!(toolRadius > 0)) {
    throw new RangeError('toolRadius must be greater than 0');
  }
  if (!(stepover > 0)) {
    throw new RangeError('stepover must be greater than 0');
  }
  if (stepover > 2 * toolRadius) {
    throw new RangeError('stepover must not exceed the tool diameter (2 x toolRadius)');
  }

  const halfStep = stepover / 2;
  const h = toolRadius - Math.sqrt(toolRadius * toolRadius - halfStep * halfStep);

  return {
    cuspHeight: roundTo(h, 4),
    surfaceRoughness: roundTo((h * 1000) / 4, 2), // mm → μm, then /4 for Ra approx
  };
}
