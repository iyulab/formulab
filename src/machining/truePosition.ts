import { roundTo } from '../utils.js';
import type { TruePositionInput, TruePositionResult } from './types.js';

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
 */
export function truePosition(input: TruePositionInput): TruePositionResult {
  const { actualX, actualY, nominalX, nominalY, tolerance, featureSize, mmcSize } = input;

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
