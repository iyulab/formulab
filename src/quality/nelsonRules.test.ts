import { describe, it, expect } from 'vitest';
import { nelsonRules } from './nelsonRules.js';

describe('nelsonRules', () => {
  const cl = 50;
  const sigma = 5;

  describe('Rule 1: point beyond 3σ', () => {
    it('should detect point above 3σ', () => {
      const values = [50, 51, 49, 66, 50]; // 66 > 50+15=65
      const result = nelsonRules({ values, centerLine: cl, sigma });
      expect(result.hasViolation).toBe(true);
      const r1 = result.violations.find(v => v.rule === 1);
      expect(r1).toBeDefined();
      expect(r1!.indices).toContain(3);
    });

    it('should detect point below 3σ', () => {
      const values = [50, 34, 50]; // 34 < 50-15=35
      const result = nelsonRules({ values, centerLine: cl, sigma });
      const r1 = result.violations.find(v => v.rule === 1);
      expect(r1).toBeDefined();
      expect(r1!.indices).toContain(1);
    });

    it('should not trigger for points within 3σ', () => {
      const values = [50, 55, 45, 60, 40];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [1] });
      expect(result.hasViolation).toBe(false);
    });
  });

  describe('Rule 2: nine consecutive on same side', () => {
    it('should detect 9 points above CL', () => {
      const values = [51, 52, 53, 51, 52, 53, 51, 52, 53];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [2] });
      expect(result.hasViolation).toBe(true);
      expect(result.violations[0].indices.length).toBe(9);
    });

    it('should not trigger with fewer than 9', () => {
      const values = [51, 52, 53, 51, 52, 53, 51, 52];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [2] });
      expect(result.hasViolation).toBe(false);
    });

    it('should not trigger if a point crosses CL', () => {
      const values = [51, 52, 53, 51, 49, 53, 51, 52, 53];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [2] });
      expect(result.hasViolation).toBe(false);
    });
  });

  describe('Rule 3: six consecutive increasing or decreasing', () => {
    it('should detect 6 increasing points', () => {
      const values = [40, 42, 44, 46, 48, 50];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [3] });
      expect(result.hasViolation).toBe(true);
      expect(result.violations[0].indices).toEqual([0, 1, 2, 3, 4, 5]);
    });

    it('should detect 6 decreasing points', () => {
      const values = [60, 58, 56, 54, 52, 50];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [3] });
      expect(result.hasViolation).toBe(true);
    });

    it('should not trigger with only 5', () => {
      const values = [40, 42, 44, 46, 48];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [3] });
      expect(result.hasViolation).toBe(false);
    });
  });

  describe('Rule 4: fourteen alternating', () => {
    it('should detect alternating pattern', () => {
      const values = [48, 52, 48, 52, 48, 52, 48, 52, 48, 52, 48, 52, 48, 52];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [4] });
      expect(result.hasViolation).toBe(true);
      expect(result.violations[0].indices.length).toBe(14);
    });

    it('should not trigger with fewer than 14', () => {
      const values = [48, 52, 48, 52, 48, 52, 48, 52, 48, 52, 48, 52, 48];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [4] });
      expect(result.hasViolation).toBe(false);
    });
  });

  describe('Rule 5: two of three beyond 2σ (same side)', () => {
    it('should detect two above 2σ in three points', () => {
      const values = [61, 50, 62]; // 61,62 > 60
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [5] });
      expect(result.hasViolation).toBe(true);
    });

    it('should detect two below 2σ', () => {
      const values = [39, 50, 38]; // 39,38 < 40
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [5] });
      expect(result.hasViolation).toBe(true);
    });

    it('should not trigger when only one beyond 2σ', () => {
      const values = [61, 50, 50];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [5] });
      expect(result.hasViolation).toBe(false);
    });
  });

  describe('Rule 6: four of five beyond 1σ (same side)', () => {
    it('should detect four above 1σ in five points', () => {
      const values = [56, 57, 50, 58, 56]; // 4 of 5 > 55
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [6] });
      expect(result.hasViolation).toBe(true);
    });

    it('should not trigger with only three', () => {
      const values = [56, 57, 50, 50, 56]; // 3 of 5 > 55
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [6] });
      expect(result.hasViolation).toBe(false);
    });
  });

  describe('Rule 7: fifteen within ±1σ (stratification)', () => {
    it('should detect stratification', () => {
      const values = Array(15).fill(0).map((_, i) => 50 + (i % 3 - 1) * 2); // all within ±4.99
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [7] });
      expect(result.hasViolation).toBe(true);
    });

    it('should not trigger with fewer than 15', () => {
      const values = Array(14).fill(50);
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [7] });
      expect(result.hasViolation).toBe(false);
    });
  });

  describe('Rule 8: eight beyond ±1σ on both sides (mixture)', () => {
    it('should detect mixture pattern', () => {
      // All beyond 1σ, alternating sides
      const values = [56, 44, 57, 43, 58, 42, 56, 44];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [8] });
      expect(result.hasViolation).toBe(true);
    });

    it('should not trigger if all on same side', () => {
      const values = [56, 57, 58, 59, 56, 57, 58, 59]; // all > 55, same side
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [8] });
      expect(result.hasViolation).toBe(false);
    });

    it('should not trigger with fewer than 8', () => {
      const values = [56, 44, 57, 43, 58, 42, 56];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [8] });
      expect(result.hasViolation).toBe(false);
    });
  });

  describe('selective rules', () => {
    it('should only check specified rules', () => {
      const values = [66]; // triggers rule 1 only
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [2, 3] });
      expect(result.hasViolation).toBe(false);
    });
  });

  describe('validation', () => {
    it('should throw for empty values', () => {
      expect(() => nelsonRules({ values: [], centerLine: cl, sigma }))
        .toThrow(RangeError);
    });

    it('should throw for sigma <= 0', () => {
      expect(() => nelsonRules({ values: [50], centerLine: cl, sigma: 0 }))
        .toThrow(RangeError);
    });

    it('should throw for negative sigma', () => {
      expect(() => nelsonRules({ values: [50], centerLine: cl, sigma: -1 }))
        .toThrow(RangeError);
    });

    it('should throw for non-finite center line', () => {
      expect(() => nelsonRules({ values: [50], centerLine: NaN, sigma: 5 }))
        .toThrow(RangeError);
    });
  });

  describe('no violations', () => {
    it('should return empty violations for stable process', () => {
      const values = [50, 51, 49, 50, 52, 48, 50, 51];
      const result = nelsonRules({ values, centerLine: cl, sigma, rules: [1] });
      expect(result.hasViolation).toBe(false);
      expect(result.violations).toEqual([]);
    });
  });
});
