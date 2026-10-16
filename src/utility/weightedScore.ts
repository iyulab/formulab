import { roundTo, requireFinite } from '../utils.js';
import type { WeightedScoreInput, WeightedScoreResult, WeightedScoreAlternative } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Weighted scoring of alternatives against criteria, with ranking
 *
 * @param input - Weighted score input with criteria, weights, alternatives and score matrix
 * @returns Ranked alternatives with weighted scores and normalized weights
 * @throws RangeError if criteria/weights/alternatives/scores are missing or empty,
 *   if criteria and weights lengths differ, if the scores matrix dimensions do not
 *   match alternatives × criteria, if any weight is negative, or if the weight sum is 0
 * @remarks Scores may be negative (a penalty criterion); weights may not.
 */
export function weightedScore(input: WeightedScoreInput): WeightedScoreResult {
  requireFinite('weightedScore', input);
  const { criteria, weights, alternatives, scores } = input;
  if (!criteria) {
    throw inputRangeError('criteria is required', { code: 'missing_option', parameter: 'criteria' });
  }
  if (!weights) {
    throw inputRangeError('weights is required', { code: 'missing_option', parameter: 'weights' });
  }
  if (!alternatives) {
    throw inputRangeError('alternatives is required', { code: 'missing_option', parameter: 'alternatives' });
  }
  if (!scores) {
    throw inputRangeError('scores is required', { code: 'missing_option', parameter: 'scores' });
  }
  if (criteria.length === 0) {
    throw inputRangeError('criteria must contain at least 1 entry', { code: 'empty_input', parameter: 'criteria' });
  }
  if (alternatives.length === 0) {
    throw inputRangeError('alternatives must contain at least 1 entry', {
      code: 'empty_input', parameter: 'alternatives',
    });
  }
  if (criteria.length !== weights.length) {
    throw inputRangeError(`weights length must match criteria length ${criteria.length}, got ${weights.length}`, {
      code: 'dimension_mismatch', parameter: 'weights', expected: criteria.length, got: weights.length,
    });
  }
  if (scores.length !== alternatives.length) {
    throw inputRangeError(`scores must have one row per alternative (${alternatives.length}), got ${scores.length}`, {
      code: 'dimension_mismatch', parameter: 'scores', expected: alternatives.length, got: scores.length,
    });
  }
  scores.forEach((row, i) => {
    if (row.length !== criteria.length) {
      throw inputRangeError(`each scores row must have one value per criterion (${criteria.length}), got ${row.length}`, {
        code: 'dimension_mismatch', parameter: `scores[${i}]`, expected: criteria.length, got: row.length,
      });
    }
  });

  // A negative weight turns a criterion into its opposite and can flip the ranking.
  weights.forEach((w, j) => {
    if (!(w >= 0)) {
      throw inputRangeError(`weights[${j}] must not be negative, got ${w}`, {
        code: 'parameter_out_of_range', parameter: `weights[${j}]`, min: 0, got: w,
      });
    }
  });

  // Normalize weights to sum to 1
  const weightSum = weights.reduce((a, v) => a + v, 0);
  if (weightSum === 0) {
    throw new RangeError(`weight sum must be > 0, got ${weightSum}`);
  }
  const normalizedWeights = weights.map((w) => roundTo(w / weightSum, 6));

  // Calculate weighted scores for each alternative
  const results: WeightedScoreAlternative[] = alternatives.map((name, i) => {
    const weightedScores = scores[i].map((s, j) => roundTo(s * normalizedWeights[j], 6));
    const totalScore = roundTo(weightedScores.reduce((a, v) => a + v, 0), 6);
    return { name, totalScore, rank: 0, weightedScores };
  });

  // Sort by total score descending and assign ranks
  results.sort((a, b) => b.totalScore - a.totalScore);
  results.forEach((r, i) => { r.rank = i + 1; });

  return {
    rankings: results,
    normalizedWeights,
  };
}
