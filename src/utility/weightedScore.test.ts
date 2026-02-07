import { describe, it, expect } from 'vitest';
import { weightedScore } from './weightedScore.js';

describe('weightedScore', () => {
  it('should rank alternatives by weighted score', () => {
    const result = weightedScore({
      criteria: ['Cost', 'Quality', 'Delivery'],
      weights: [3, 5, 2],
      alternatives: ['Supplier A', 'Supplier B', 'Supplier C'],
      scores: [
        [8, 6, 7],
        [6, 9, 5],
        [7, 7, 8],
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.rankings).toHaveLength(3);
    expect(result!.rankings[0].rank).toBe(1);
    expect(result!.rankings[1].rank).toBe(2);
    expect(result!.rankings[2].rank).toBe(3);
  });

  it('should normalize weights', () => {
    const result = weightedScore({
      criteria: ['A', 'B'],
      weights: [1, 3],
      alternatives: ['X'],
      scores: [[10, 10]],
    });
    expect(result!.normalizedWeights[0]).toBe(0.25);
    expect(result!.normalizedWeights[1]).toBe(0.75);
  });

  it('should calculate correct weighted scores', () => {
    const result = weightedScore({
      criteria: ['A', 'B'],
      weights: [1, 1],
      alternatives: ['X'],
      scores: [[8, 6]],
    });
    // Equal weights → normalized to [0.5, 0.5]
    // Weighted: [4, 3] → total = 7
    expect(result!.rankings[0].totalScore).toBe(7);
  });

  it('should handle single alternative', () => {
    const result = weightedScore({
      criteria: ['Cost', 'Quality'],
      weights: [1, 1],
      alternatives: ['Only'],
      scores: [[5, 8]],
    });
    expect(result!.rankings[0].rank).toBe(1);
    expect(result!.rankings[0].name).toBe('Only');
  });

  it('should handle equal scores', () => {
    const result = weightedScore({
      criteria: ['A'],
      weights: [1],
      alternatives: ['X', 'Y'],
      scores: [[10], [10]],
    });
    expect(result!.rankings[0].totalScore).toBe(result!.rankings[1].totalScore);
  });

  it('should return null for mismatched criteria and weights', () => {
    expect(weightedScore({
      criteria: ['A', 'B'], weights: [1], alternatives: ['X'], scores: [[1, 2]],
    })).toBeNull();
  });

  it('should return null for mismatched scores dimensions', () => {
    expect(weightedScore({
      criteria: ['A'], weights: [1], alternatives: ['X', 'Y'], scores: [[1]],
    })).toBeNull();
  });

  it('should return null for zero weights', () => {
    expect(weightedScore({
      criteria: ['A'], weights: [0], alternatives: ['X'], scores: [[5]],
    })).toBeNull();
  });

  it('should return null for empty criteria', () => {
    expect(weightedScore({
      criteria: [], weights: [], alternatives: ['X'], scores: [[]],
    })).toBeNull();
  });

  it('should return null for empty alternatives', () => {
    expect(weightedScore({
      criteria: ['A'], weights: [1], alternatives: [], scores: [],
    })).toBeNull();
  });
});
