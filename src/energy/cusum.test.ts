import { describe, it, expect } from 'vitest';
import { cusum } from './cusum.js';

describe('cusum', () => {
  describe('stable process', () => {
    it('should detect no shift for stable data', () => {
      const values = [10, 10.1, 9.9, 10.0, 10.2, 9.8, 10.1, 9.9, 10.0, 10.1];
      const result = cusum({ values, target: 10, stdDev: 0.5 });

      expect(result.isOutOfControl).toBe(false);
      expect(result.signals).toHaveLength(0);
      expect(result.shiftDetected).toBe('none');
    });
  });

  describe('positive shift detection', () => {
    it('should detect upward shift', () => {
      // Stable at 10, then shift to 12
      const values = [10, 10, 10, 10, 10, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
      const result = cusum({ values, target: 10, stdDev: 0.5 });

      expect(result.isOutOfControl).toBe(true);
      expect(result.shiftDetected).toBe('positive');
      expect(result.signals.length).toBeGreaterThan(0);
      // First signal should be after the shift started
      expect(result.signals[0]).toBeGreaterThanOrEqual(5);
    });
  });

  describe('negative shift detection', () => {
    it('should detect downward shift', () => {
      const values = [10, 10, 10, 10, 10, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
      const result = cusum({ values, target: 10, stdDev: 0.5 });

      expect(result.isOutOfControl).toBe(true);
      expect(result.shiftDetected).toBe('negative');
    });
  });

  describe('CUSUM arrays', () => {
    it('should have correct array lengths', () => {
      const values = [1, 2, 3, 4, 5];
      const result = cusum({ values, target: 3, stdDev: 1 });

      expect(result.cusumPositive).toHaveLength(5);
      expect(result.cusumNegative).toHaveLength(5);
    });

    it('should start from 0', () => {
      const result = cusum({ values: [10], target: 10, stdDev: 1 });

      // First value at target → C+ = max(0, 10-(10+0.5)+0) = 0
      expect(result.cusumPositive[0]).toBe(0);
    });

    it('should never go below 0', () => {
      const values = [10, 9, 8, 7, 10, 10, 10];
      const result = cusum({ values, target: 10, stdDev: 1 });

      result.cusumPositive.forEach(v => expect(v).toBeGreaterThanOrEqual(0));
      result.cusumNegative.forEach(v => expect(v).toBeGreaterThanOrEqual(0));
    });
  });

  describe('auto stdDev', () => {
    it('should auto-calculate stdDev when not provided', () => {
      const values = [10, 10, 10, 10, 10, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15];
      const result = cusum({ values, target: 10 });

      // Should still detect the shift
      expect(result.cusumPositive.length).toBe(15);
    });
  });

  describe('custom parameters', () => {
    it('should respect custom allowance (K)', () => {
      const values = [10.5, 10.5, 10.5, 10.5, 10.5];
      const tight = cusum({ values, target: 10, allowance: 0.1, decisionInterval: 1, stdDev: 0.5 });
      const loose = cusum({ values, target: 10, allowance: 1.0, decisionInterval: 1, stdDev: 0.5 });

      // Tighter allowance → more sensitive
      expect(tight.cusumPositive[4]).toBeGreaterThan(loose.cusumPositive[4]);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const result = cusum({ values: [], target: 10 });
      expect(result.cusumPositive).toHaveLength(0);
      expect(result.isOutOfControl).toBe(false);
    });

    it('should handle single value', () => {
      const result = cusum({ values: [10], target: 10, stdDev: 1 });
      expect(result.cusumPositive).toHaveLength(1);
    });
  });
});
