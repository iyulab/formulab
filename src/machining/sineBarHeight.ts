import { roundTo, requireFinite } from '../utils.js';
import type { SineBarHeightInput, SineBarHeightResult } from './types.js';
import { InputRangeError } from '../errors.js';

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
 * @throws RangeError if sineBarLength is not greater than 0, the angle is outside [0, 90] degrees (a gauge stack
 *   cannot be negative, and past 90° the same stack sets 180° − θ), roundToBlock is provided but not greater
 *   than 0, or roundToBlock rounds the stack beyond the bar length
 */
export function sineBarHeight(input: SineBarHeightInput): SineBarHeightResult {
  requireFinite('sineBarHeight', input);
  const { angle, sineBarLength, roundToBlock } = input;

  // The actual angle is recovered as asin(roundedHeight / sineBarLength).
  if (!(sineBarLength > 0)) {
    throw new InputRangeError('sineBarLength must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'sineBarLength', exclusive_min: 0, got: sineBarLength,
    });
  }
  if (!(angle >= 0 && angle <= 90)) {
    throw new InputRangeError('angle must be between 0 and 90 degrees', {
      code: 'parameter_out_of_range', parameter: 'angle', min: 0, max: 90, got: angle,
    });
  }
  if (roundToBlock !== undefined && !(roundToBlock > 0)) {
    throw new InputRangeError('roundToBlock must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'roundToBlock', exclusive_min: 0, got: roundToBlock,
    });
  }

  const angleRad = (angle * Math.PI) / 180;
  const height = sineBarLength * Math.sin(angleRad);

  const result: SineBarHeightResult = {
    height: roundTo(height, 4),
  };

  if (roundToBlock !== undefined) {
    const rounded = Math.round(height / roundToBlock) * roundToBlock;
    // A coarse block increment can round the stack past the bar length, where no angle exists.
    if (rounded > sineBarLength) {
      throw new RangeError('roundToBlock rounds the gauge stack beyond the sine bar length');
    }
    result.roundedHeight = roundTo(rounded, 4);

    const actualAngleRad = Math.asin(rounded / sineBarLength);
    const actualAngleDeg = (actualAngleRad * 180) / Math.PI;
    result.actualAngle = roundTo(actualAngleDeg, 6);
    result.angleError = roundTo(actualAngleDeg - angle, 6);
  }

  return result;
}
