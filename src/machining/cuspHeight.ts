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
 */
export function cuspHeight(input: CuspHeightInput): CuspHeightResult {
  const { toolRadius, stepover } = input;

  const halfStep = stepover / 2;
  const h = toolRadius - Math.sqrt(toolRadius * toolRadius - halfStep * halfStep);

  return {
    cuspHeight: roundTo(h, 4),
    surfaceRoughness: roundTo((h * 1000) / 4, 2), // mm → μm, then /4 for Ra approx
  };
}
