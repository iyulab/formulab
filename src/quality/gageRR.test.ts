import { describe, it, expect } from 'vitest';
import { gageRR } from './gageRR.js';

describe('gageRR', () => {
  // Classic AIAG example: 10 parts × 3 operators × 2 trials
  const classicMeasurements: number[][][] = [
    [[5.02, 5.04], [5.01, 5.03], [5.03, 5.02]], // Part 1
    [[3.98, 3.99], [3.97, 3.99], [3.98, 3.98]], // Part 2
    [[4.50, 4.51], [4.49, 4.50], [4.51, 4.50]], // Part 3
    [[4.20, 4.22], [4.21, 4.20], [4.20, 4.21]], // Part 4
    [[5.50, 5.48], [5.49, 5.50], [5.48, 5.49]], // Part 5
    [[3.50, 3.52], [3.51, 3.50], [3.52, 3.51]], // Part 6
    [[4.80, 4.81], [4.79, 4.80], [4.80, 4.79]], // Part 7
    [[4.10, 4.12], [4.11, 4.10], [4.10, 4.11]], // Part 8
    [[5.20, 5.22], [5.21, 5.20], [5.22, 5.21]], // Part 9
    [[3.80, 3.82], [3.81, 3.80], [3.82, 3.81]], // Part 10
  ];

  describe('basic calculation', () => {
    it('should compute GRR components', () => {
      const result = gageRR({ measurements: classicMeasurements });

      expect(result.ev).toBeGreaterThan(0);
      expect(result.grr).toBeGreaterThan(0);
      expect(result.pv).toBeGreaterThan(0);
      expect(result.tv).toBeGreaterThan(0);
      expect(result.percentGRR).toBeGreaterThan(0);
      expect(result.percentGRR).toBeLessThanOrEqual(100);
    });

    it('should satisfy TV² = GRR² + PV²', () => {
      const result = gageRR({ measurements: classicMeasurements });
      const tvSquared = result.grr ** 2 + result.pv ** 2;
      expect(result.tv ** 2).toBeCloseTo(tvSquared, 2);
    });

    it('should satisfy GRR² = EV² + AV²', () => {
      const result = gageRR({ measurements: classicMeasurements });
      const grrSquared = result.ev ** 2 + result.av ** 2;
      expect(result.grr ** 2).toBeCloseTo(grrSquared, 4);
    });
  });

  describe('status classification', () => {
    it('should classify as acceptable when %GRR <= 10', () => {
      // With high part variation and low measurement error, %GRR should be low
      const result = gageRR({ measurements: classicMeasurements });
      // These measurements have very small range → low EV, high PV → low %GRR
      expect(result.status).toBe('acceptable');
    });

    it('should classify as unacceptable for poor measurement system', () => {
      // Create data with very high measurement variation
      const noisyData: number[][][] = [
        [[1.0, 5.0], [2.0, 4.0], [3.0, 6.0]],
        [[1.5, 4.5], [2.5, 3.5], [1.0, 5.0]],
        [[2.0, 5.0], [1.0, 4.0], [3.0, 6.0]],
      ];
      const result = gageRR({ measurements: noisyData });
      expect(result.status).toBe('unacceptable');
    });
  });

  describe('tolerance-based %GRR', () => {
    it('should calculate percentTolerance when tolerance is provided', () => {
      const result = gageRR({ measurements: classicMeasurements, tolerance: 2.0 });
      expect(result.percentTolerance).not.toBeNull();
      expect(result.percentTolerance!).toBeGreaterThan(0);
    });

    it('should return null percentTolerance when tolerance is not provided', () => {
      const result = gageRR({ measurements: classicMeasurements });
      expect(result.percentTolerance).toBeNull();
    });
  });

  describe('ndc (number of distinct categories)', () => {
    it('should calculate ndc >= 1 for reasonable data', () => {
      const result = gageRR({ measurements: classicMeasurements });
      expect(result.ndc).toBeGreaterThanOrEqual(1);
    });

    it('should have ndc >= 5 for acceptable measurement system (AIAG guideline)', () => {
      const result = gageRR({ measurements: classicMeasurements });
      // Good measurement system should have ndc >= 5
      expect(result.ndc).toBeGreaterThanOrEqual(5);
    });
  });

  describe('edge cases', () => {
    it('should handle 2 operators × 3 trials', () => {
      const data: number[][][] = [
        [[5.0, 5.0, 5.1], [5.0, 5.1, 5.0]],
        [[4.0, 4.0, 4.1], [4.0, 4.1, 4.0]],
        [[3.0, 3.0, 3.1], [3.0, 3.1, 3.0]],
      ];
      const result = gageRR({ measurements: data });
      expect(result.ev).toBeGreaterThan(0);
      expect(result.percentGRR).toBeLessThan(100);
    });

    it('should handle identical measurements (zero variation)', () => {
      const data: number[][][] = [
        [[5.0, 5.0], [5.0, 5.0]],
        [[4.0, 4.0], [4.0, 4.0]],
        [[3.0, 3.0], [3.0, 3.0]],
      ];
      const result = gageRR({ measurements: data });
      expect(result.ev).toBe(0);
      expect(result.grr).toBe(0);
      expect(result.percentGRR).toBe(0);
    });
  });
});
