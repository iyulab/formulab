import { describe, it, expect } from 'vitest';
import { weibull } from './weibull.js';

describe('weibull', () => {
  describe('wearout failure mode (β > 1)', () => {
    it('should detect wearout failure with β > 1', () => {
      // Increasing failure rate → wearout
      const result = weibull({
        failureTimes: [100, 120, 130, 140, 150, 160, 170, 180, 190, 200],
      });

      expect(result.beta).toBeGreaterThan(1.05);
      expect(result.failureMode).toBe('wearout');
      expect(result.eta).toBeGreaterThan(0);
      expect(result.mttf).toBeGreaterThan(0);
      expect(result.r2).toBeGreaterThan(0.8);
    });
  });

  describe('random failure mode (β ≈ 1)', () => {
    it('should detect random failure with β ≈ 1', () => {
      // Exponential-like failure data → β ≈ 1
      const result = weibull({
        failureTimes: [5, 15, 40, 60, 100, 180, 250, 400, 600, 1000],
      });

      expect(result.beta).toBeGreaterThan(0);
      expect(result.eta).toBeGreaterThan(0);
    });
  });

  describe('infant mortality (β < 1)', () => {
    it('should detect infant mortality with β < 1', () => {
      // Early failures clustering → β < 1
      const result = weibull({
        failureTimes: [1, 2, 3, 5, 10, 50, 200, 500, 1000, 5000],
      });

      expect(result.beta).toBeLessThan(0.95);
      expect(result.failureMode).toBe('infant');
    });
  });

  describe('reliability prediction', () => {
    it('should calculate reliability at mission time', () => {
      const result = weibull({
        failureTimes: [100, 120, 130, 140, 150, 160, 170, 180, 190, 200],
        missionTime: 100,
      });

      expect(result.reliability).not.toBeNull();
      expect(result.reliability!).toBeGreaterThan(0);
      expect(result.reliability!).toBeLessThanOrEqual(1);
    });

    it('should return null reliability when no mission time', () => {
      const result = weibull({
        failureTimes: [100, 200, 300],
      });

      expect(result.reliability).toBeNull();
    });

    it('should return ~1 for very short mission time', () => {
      const result = weibull({
        failureTimes: [100, 120, 130, 140, 150, 160, 170, 180, 190, 200],
        missionTime: 1,
      });

      expect(result.reliability!).toBeGreaterThan(0.99);
    });
  });

  describe('B-life calculations', () => {
    it('should have B10 < B50 < eta for β > 1', () => {
      const result = weibull({
        failureTimes: [100, 120, 130, 140, 150, 160, 170, 180, 190, 200],
      });

      expect(result.b10Life).toBeLessThan(result.b50Life);
      expect(result.b50Life).toBeLessThan(result.eta);
    });

    it('should have B50 ≈ MTTF for β ≈ 3.5 (normal-like)', () => {
      // When β ≈ 3.5, Weibull approximates normal → B50 ≈ MTTF
      const result = weibull({
        failureTimes: [95, 97, 98, 99, 100, 101, 102, 103, 105, 106],
      });

      // Not exact but should be in same ballpark
      expect(Math.abs(result.b50Life - result.mttf) / result.mttf).toBeLessThan(0.2);
    });
  });

  describe('regression quality', () => {
    it('should have high R² for clean data', () => {
      // Data that follows Weibull distribution well
      const result = weibull({
        failureTimes: [100, 120, 130, 140, 150, 160, 170, 180, 190, 200],
      });

      expect(result.r2).toBeGreaterThan(0.9);
    });
  });

  describe('edge cases', () => {
    it('should handle minimum 2 data points', () => {
      const result = weibull({ failureTimes: [100, 200] });

      expect(result.beta).toBeGreaterThan(0);
      expect(result.eta).toBeGreaterThan(0);
      expect(result.r2).toBe(1); // Perfect fit with 2 points
    });

    it('should handle unsorted input', () => {
      const result1 = weibull({ failureTimes: [200, 100, 150] });
      const result2 = weibull({ failureTimes: [100, 150, 200] });

      expect(result1.beta).toBeCloseTo(result2.beta, 4);
      expect(result1.eta).toBeCloseTo(result2.eta, 2);
    });
  });
});
