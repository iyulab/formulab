import { describe, it, expect } from 'vitest';
import { learningCurve } from './learningCurve.js';

describe('learningCurve', () => {
  describe('basic calculation', () => {
    it('should return firstUnitTime for unit 1', () => {
      const result = learningCurve({ firstUnitTime: 100, learningRate: 0.8, unitNumber: 1 });
      expect(result.unitTime).toBe(100);
      expect(result.cumulativeTotalTime).toBe(100);
    });

    it('should compute 80% learning curve for unit 2', () => {
      // b = ln(0.8)/ln(2) ≈ -0.3219
      // unitTime(2) = 100 × 2^(-0.3219) ≈ 80
      const result = learningCurve({ firstUnitTime: 100, learningRate: 0.8, unitNumber: 2 });
      expect(result.unitTime).toBeCloseTo(80, 0);
    });

    it('should compute 80% learning curve for unit 4', () => {
      // unitTime(4) = 100 × 4^(-0.3219) ≈ 64
      const result = learningCurve({ firstUnitTime: 100, learningRate: 0.8, unitNumber: 4 });
      expect(result.unitTime).toBeCloseTo(64, 0);
    });

    it('should compute learning exponent', () => {
      const result = learningCurve({ firstUnitTime: 100, learningRate: 0.8, unitNumber: 1 });
      const expected = Math.log(0.8) / Math.log(2);
      expect(result.learningExponent).toBeCloseTo(expected, 4);
    });

    it('should compute cumulative total time', () => {
      const result = learningCurve({ firstUnitTime: 100, learningRate: 0.8, unitNumber: 2 });
      // Unit model: T(1)=100, T(2)=80 → cumTotal = 180
      expect(result.cumulativeTotalTime).toBeCloseTo(180, 0);
    });

    it('should handle 90% learning rate', () => {
      const result = learningCurve({ firstUnitTime: 50, learningRate: 0.9, unitNumber: 2 });
      expect(result.unitTime).toBeCloseTo(45, 0);
    });
  });

  describe('cumulative model', () => {
    it('should compute cumulative average model', () => {
      const result = learningCurve({
        firstUnitTime: 100, learningRate: 0.8, unitNumber: 2, model: 'cumulative',
      });
      // Cumulative avg model: T̄(2) = 100 × 2^b ≈ 80, cumTotal = 160
      expect(result.cumulativeAverageTime).toBeCloseTo(80, 0);
      expect(result.cumulativeTotalTime).toBeCloseTo(160, 0);
    });

    it('should derive individual unit time from cumulative model', () => {
      const result = learningCurve({
        firstUnitTime: 100, learningRate: 0.8, unitNumber: 2, model: 'cumulative',
      });
      // T(2) = cumTotal(2) - cumTotal(1) = 160 - 100 = 60
      expect(result.unitTime).toBeCloseTo(60, 0);
    });

    it('should differ from unit model for same inputs', () => {
      const unitResult = learningCurve({
        firstUnitTime: 100, learningRate: 0.8, unitNumber: 4, model: 'unit',
      });
      const cumResult = learningCurve({
        firstUnitTime: 100, learningRate: 0.8, unitNumber: 4, model: 'cumulative',
      });
      // Two models should give different cumulative totals
      expect(unitResult.cumulativeTotalTime).not.toBeCloseTo(cumResult.cumulativeTotalTime, 0);
    });
  });

  describe('validation', () => {
    it('should throw for firstUnitTime <= 0', () => {
      expect(() => learningCurve({ firstUnitTime: 0, learningRate: 0.8, unitNumber: 1 }))
        .toThrow(RangeError);
    });

    it('should throw for negative firstUnitTime', () => {
      expect(() => learningCurve({ firstUnitTime: -10, learningRate: 0.8, unitNumber: 1 }))
        .toThrow(RangeError);
    });

    it('should throw for learningRate <= 0', () => {
      expect(() => learningCurve({ firstUnitTime: 100, learningRate: 0, unitNumber: 1 }))
        .toThrow(RangeError);
    });

    it('should throw for learningRate >= 1', () => {
      expect(() => learningCurve({ firstUnitTime: 100, learningRate: 1, unitNumber: 1 }))
        .toThrow(RangeError);
    });

    it('should throw for unitNumber < 1', () => {
      expect(() => learningCurve({ firstUnitTime: 100, learningRate: 0.8, unitNumber: 0 }))
        .toThrow(RangeError);
    });

    it('should throw for non-integer unitNumber', () => {
      expect(() => learningCurve({ firstUnitTime: 100, learningRate: 0.8, unitNumber: 1.5 }))
        .toThrow(RangeError);
    });

    it('should throw for NaN firstUnitTime', () => {
      expect(() => learningCurve({ firstUnitTime: NaN, learningRate: 0.8, unitNumber: 1 }))
        .toThrow(RangeError);
    });
  });
});
