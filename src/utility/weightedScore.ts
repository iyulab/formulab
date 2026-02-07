import { roundTo } from '../utils.js';
import type { WeightedScoreInput, WeightedScoreResult, WeightedScoreAlternative } from './types.js';

export function weightedScore(input: WeightedScoreInput): WeightedScoreResult | null {
  const { criteria, weights, alternatives, scores } = input;
  if (!criteria || !weights || !alternatives || !scores) return null;
  if (criteria.length === 0 || alternatives.length === 0) return null;
  if (criteria.length !== weights.length) return null;
  if (scores.length !== alternatives.length) return null;
  for (const row of scores) {
    if (row.length !== criteria.length) return null;
  }

  // Normalize weights to sum to 1
  const weightSum = weights.reduce((a, v) => a + v, 0);
  if (weightSum === 0) return null;
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
