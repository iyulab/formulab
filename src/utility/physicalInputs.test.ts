import { describe, it, expect } from 'vitest';
import { weightedScore } from './weightedScore.js';

// A negative weight turned a criterion into its opposite and could flip the ranking; it is refused now.
describe('utility physical-input domains', () => {
  describe('weightedScore', () => {
    it('refuses a negative or NaN weight', () => {
      expect(() => weightedScore({ criteria: ['Cost', 'Quality', 'Delivery'], weights: [3, -5, 2], alternatives: ['A', 'B'], scores: [[8, 6, 7], [6, 9, 5]] })).toThrow(RangeError);
      expect(() => weightedScore({ criteria: ['Cost', 'Quality'], weights: [3, NaN], alternatives: ['A'], scores: [[8, 6]] })).toThrow(RangeError);
    });

    it('accepts a zero weight and negative scores', () => {
      const result = weightedScore({ criteria: ['Penalty', 'Ignored'], weights: [1, 0], alternatives: ['A', 'B'], scores: [[-2, 9], [1, 0]] });
      expect(result.normalizedWeights).toEqual([1, 0]);
      expect(result.rankings[0].name).toBe('B');
      expect(result.rankings[1].totalScore).toBe(-2);
    });
  });
});
