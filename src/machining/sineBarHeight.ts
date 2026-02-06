import { roundTo } from '../utils.js';
import type { SineBarHeightInput, SineBarHeightResult } from './types.js';

/**
 * Calculate the gauge block height for a sine bar setup.
 *
 * @formula
 *   H = L × sin(θ)
 *   actualAngle = arcsin(roundedH / L)
 *   error = actualAngle − θ
 *
 * @reference Oberg, E. et al. "Machinery's Handbook", 31st Ed. — Sine Bar section.
 *
 * @param input - Sine bar parameters
 * @returns SineBarHeightResult with exact and optionally rounded height
 */
export function sineBarHeight(input: SineBarHeightInput): SineBarHeightResult {
  const { angle, sineBarLength, roundToBlock } = input;

  const angleRad = (angle * Math.PI) / 180;
  const height = sineBarLength * Math.sin(angleRad);

  const result: SineBarHeightResult = {
    height: roundTo(height, 4),
  };

  if (roundToBlock !== undefined && roundToBlock > 0) {
    const rounded = Math.round(height / roundToBlock) * roundToBlock;
    result.roundedHeight = roundTo(rounded, 4);

    const actualAngleRad = Math.asin(rounded / sineBarLength);
    const actualAngleDeg = (actualAngleRad * 180) / Math.PI;
    result.actualAngle = roundTo(actualAngleDeg, 6);
    result.angleError = roundTo(actualAngleDeg - angle, 6);
  }

  return result;
}
