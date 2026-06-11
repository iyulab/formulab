import { roundTo } from '../utils.js';
import type { WeightedScoreInput, WeightedScoreResult, WeightedScoreAlternative } from './types.js';

/**
 * Weighted scoring of alternatives against criteria, with ranking
 *
 * @param input - Weighted score input with criteria, weights, alternatives and score matrix
 * @returns Ranked alternatives with weighted scores and normalized weights
 * @throws RangeError if criteria/weights/alternatives/scores are missing or empty,
 *   if criteria and weights lengths differ, if the scores matrix dimensions do not
 *   match alternatives × criteria, or if the weight sum is 0
 */
export function weightedScore(input: WeightedScoreInput): WeightedScoreResult {
  const { criteria, weights, alternatives, scores } = input;
  if (!criteria || !weights || !alternatives || !scores) {
    throw new RangeError('criteria, weights, alternatives and scores are required');
  }
  if (criteria.length === 0) {
    throw new RangeError('criteria must contain at least 1 entry');
  }
  if (alternatives.length === 0) {
    throw new RangeError('alternatives must contain at least 1 entry');
  }
  if (criteria.length !== weights.length) {
    throw new RangeError(`weights length must match criteria length ${criteria.length}, got ${weights.length}`);
  }
  if (scores.length !== alternatives.length) {
    throw new RangeError(`scores must have one row per alternative (${alternatives.length}), got ${scores.length}`);
  }
  for (const row of scores) {
    if (row.length !== criteria.length) {
      throw new RangeError(`each scores row must have one value per criterion (${criteria.length}), got ${row.length}`);
    }
  }

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
