import { describe, it, expect } from 'vitest';
import { cycleTime } from './cycle.js';

describe('cycleTime', () => {
  describe('basic statistics', () => {
    it('should calculate count correctly', () => {
      const result = cycleTime({
        measurements: [10, 12, 11, 13, 14],
      });

      expect(result.count).toBe(5);
    });

    it('should calculate average correctly', () => {
      const result = cycleTime({
        measurements: [10, 12, 11, 13, 14],
      });

      // Average = (10+12+11+13+14)/5 = 60/5 = 12
      expect(result.average).toBe(12);
    });

    it('should calculate min and max correctly', () => {
      const result = cycleTime({
        measurements: [10, 12, 11, 13, 14],
      });

      expect(result.min).toBe(10);
      expect(result.max).toBe(14);
    });

    it('should calculate range correctly', () => {
      const result = cycleTime({
        measurements: [10, 12, 11, 13, 14],
      });

      // Range = max - min = 14 - 10 = 4
      expect(result.range).toBe(4);
    });
  });

  describe('standard deviation', () => {
    it('should calculate sample standard deviation correctly', () => {
      const result = cycleTime({
        measurements: [10, 12, 11, 13, 14],
      });

      // Sample stdDev = sqrt(sum((x-mean)^2) / (n-1))
      // = sqrt(((10-12)^2 + (12-12)^2 + (11-12)^2 + (13-12)^2 + (14-12)^2) / 4)
      // = sqrt((4 + 0 + 1 + 1 + 4) / 4) = sqrt(10/4) = sqrt(2.5) ≈ 1.58
      expect(result.stdDev).toBeCloseTo(1.58, 1);
    });

    it('should return 0 stdDev for single measurement', () => {
      const result = cycleTime({
        measurements: [10],
      });

      expect(result.stdDev).toBe(0);
    });
  });

  describe('coefficient of variation', () => {
    it('should calculate CV as percentage', () => {
      const result = cycleTime({
        measurements: [10, 12, 11, 13, 14],
      });

      // CV = (stdDev / mean) * 100 = (1.58 / 12) * 100 ≈ 13.2%
      expect(result.cv).toBeCloseTo(13.2, 0);
    });

    it('should return 0 CV when average is 0', () => {
      const result = cycleTime({
        measurements: [0, 0, 0],
      });

      expect(result.cv).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const result = cycleTime({
        measurements: [],
      });

      expect(result.count).toBe(0);
      expect(result.average).toBe(0);
      expect(result.min).toBe(0);
      expect(result.max).toBe(0);
      expect(result.range).toBe(0);
      expect(result.stdDev).toBe(0);
      expect(result.cv).toBe(0);
    });

    it('should handle single measurement', () => {
      const result = cycleTime({
        measurements: [15],
      });

      expect(result.count).toBe(1);
      expect(result.average).toBe(15);
      expect(result.min).toBe(15);
      expect(result.max).toBe(15);
      expect(result.range).toBe(0);
    });

    it('should handle identical measurements', () => {
      const result = cycleTime({
        measurements: [10, 10, 10, 10],
      });

      expect(result.average).toBe(10);
      expect(result.range).toBe(0);
      expect(result.stdDev).toBe(0);
      expect(result.cv).toBe(0);
    });

    it('should handle negative values', () => {
      const result = cycleTime({
        measurements: [-5, -3, -4],
      });

      expect(result.average).toBe(-4);
      expect(result.min).toBe(-5);
      expect(result.max).toBe(-3);
      expect(result.range).toBe(2);
    });
  });

  describe('real-world scenarios', () => {
    it('should analyze manufacturing cycle times', () => {
      const result = cycleTime({
        measurements: [45.2, 46.1, 44.8, 45.5, 46.3, 45.0, 45.8, 46.0, 44.9, 45.4],
      });

      expect(result.count).toBe(10);
      expect(result.average).toBeCloseTo(45.5, 1);
      expect(result.min).toBe(44.8);
      expect(result.max).toBe(46.3);
    });

    it('should analyze assembly line cycle times with high variation', () => {
      const result = cycleTime({
        measurements: [30, 35, 28, 42, 31, 38, 29, 45, 33, 40],
      });

      expect(result.range).toBe(17);
      expect(result.cv).toBeGreaterThan(10);
    });

    it('should analyze precision process with low variation', () => {
      const result = cycleTime({
        measurements: [100.1, 100.2, 99.9, 100.0, 100.1, 99.8, 100.0, 100.1],
      });

      expect(result.cv).toBeLessThan(1);
    });
  });
});
