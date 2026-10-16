import { roundTo, requireFinite } from '../utils.js';
import type { TruePositionInput, TruePositionResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate GD&T True Position (diametral method).
 *
 * @formula
 *   Δx = actualX − nominalX
 *   Δy = actualY − nominalY
 *   radial = √(Δx² + Δy²)
 *   TP = 2 × radial
 *   MMC bonus = featureSize − mmcSize (when feature is larger than MMC)
 *   effectiveTol = tolerance + bonus
 *
 * @reference ASME Y14.5-2018 — Positional tolerance.
 *
 * @param input - True position parameters
 * @returns TruePositionResult with TP value and optional tolerance evaluation
 * @throws {RangeError} a coordinate that is not finite, or a negative or non-finite tolerance,
 *   featureSize or mmcSize. Negative coordinates are valid — positions are measured from a datum.
 */
export function truePosition(input: TruePositionInput): TruePositionResult {
  requireFinite('truePosition', input);
  const { actualX, actualY, nominalX, nominalY, tolerance, featureSize, mmcSize } = input;

  for (const [name, v] of [['actualX', actualX], ['actualY', actualY], ['nominalX', nominalX], ['nominalY', nominalY]] as const) {
    if (!Number.isFinite(v)) {
      throw inputRangeError(`${name} must be a finite number`, {
        code: 'value_not_finite', parameter: name, got: v,
      });
    }
  }
  for (const [name, v] of [['tolerance', tolerance], ['featureSize', featureSize], ['mmcSize', mmcSize]] as const) {
    if (v !== undefined && (!Number.isFinite(v) || v < 0)) {
      throw inputRangeError(`${name} must be a non-negative finite number`, {
        code: 'parameter_out_of_range', parameter: name, min: 0, got: v,
      });
    }
  }

  const dx = actualX - nominalX;
  const dy = actualY - nominalY;
  const radial = Math.sqrt(dx * dx + dy * dy);
  const tp = 2 * radial;

  const result: TruePositionResult = {
    truePosition: roundTo(tp, 4),
    deviationX: roundTo(dx, 4),
    deviationY: roundTo(dy, 4),
    radialDeviation: roundTo(radial, 4),
  };

  if (featureSize !== undefined && mmcSize !== undefined) {
    const bonus = Math.max(0, featureSize - mmcSize);
    result.mmcBonus = roundTo(bonus, 4);

    if (tolerance !== undefined) {
      const effectiveTol = tolerance + bonus;
      result.effectiveTolerance = roundTo(effectiveTol, 4);
      result.inTolerance = tp <= effectiveTol;
    }
  } else if (tolerance !== undefined) {
    result.inTolerance = tp <= tolerance;
  }

  return result;
}
