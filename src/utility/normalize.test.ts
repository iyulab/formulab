import { describe, it, expect } from 'vitest';
import { normalize } from './normalize.js';

describe('normalize', () => {
  describe('min-max', () => {
    it('should normalize to 0-1 range', () => {
      const result = normalize({ data: [10, 20, 30, 40, 50], method: 'min-max' });
      expect(result).not.toBeNull();
      expect(result!.values[0]).toBe(0);
      expect(result!.values[4]).toBe(1);
      expect(result!.values[2]).toBe(0.5);
    });

    it('should handle all same values', () => {
      const result = normalize({ data: [5, 5, 5], method: 'min-max' });
      expect(result!.values).toEqual([0, 0, 0]);
    });

    it('should handle two values', () => {
      const result = normalize({ data: [0, 100], method: 'min-max' });
      expect(result!.values).toEqual([0, 1]);
    });

    it('should handle negative values', () => {
      const result = normalize({ data: [-10, 0, 10], method: 'min-max' });
      expect(result!.values[0]).toBe(0);
      expect(result!.values[1]).toBe(0.5);
      expect(result!.values[2]).toBe(1);
    });
  });

  describe('z-score', () => {
    it('should standardize data', () => {
      const result = normalize({ data: [2, 4, 4, 4, 5, 5, 7, 9], method: 'z-score' });
      expect(result).not.toBeNull();
      expect(result!.mean).toBe(5);
      // Mean value should have z-score of 0
      const meanIdx = result!.values.findIndex((v) => Math.abs(v) < 0.01);
      expect(meanIdx).toBeGreaterThanOrEqual(0);
    });

    it('should handle all same values', () => {
      const result = normalize({ data: [5, 5, 5], method: 'z-score' });
      expect(result!.values).toEqual([0, 0, 0]);
    });

    it('should produce mean of approximately 0', () => {
      const result = normalize({ data: [10, 20, 30, 40, 50], method: 'z-score' });
      const zMean = result!.values.reduce((a, v) => a + v, 0) / result!.values.length;
      expect(zMean).toBeCloseTo(0, 4);
    });
  });

  it('should return metadata', () => {
    const result = normalize({ data: [1, 2, 3, 4, 5], method: 'min-max' });
    expect(result!.min).toBe(1);
    expect(result!.max).toBe(5);
    expect(result!.mean).toBe(3);
    expect(result!.stdDev).toBeGreaterThan(0);
  });

  it('should return null for empty data', () => {
    expect(normalize({ data: [], method: 'min-max' })).toBeNull();
  });
});
