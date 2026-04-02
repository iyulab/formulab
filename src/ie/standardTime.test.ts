import { describe, it, expect } from 'vitest';
import { standardTime } from './standardTime.js';

describe('standardTime', () => {
  describe('basic calculation', () => {
    it('should calculate standard time correctly', () => {
      const result = standardTime({ observedTime: 10, ratingFactor: 1.0, allowancePercent: 15 });
      expect(result.normalTime).toBe(10);
      expect(result.standardTime).toBe(11.5);
      expect(result.allowanceTime).toBe(1.5);
    });

    it('should calculate with rating factor < 1', () => {
      const result = standardTime({ observedTime: 10, ratingFactor: 0.8, allowancePercent: 10 });
      expect(result.normalTime).toBe(8);
      expect(result.standardTime).toBe(8.8);
    });

    it('should calculate with rating factor > 1', () => {
      const result = standardTime({ observedTime: 10, ratingFactor: 1.2, allowancePercent: 10 });
      expect(result.normalTime).toBe(12);
      expect(result.standardTime).toBe(13.2);
    });

    it('should handle zero allowance', () => {
      const result = standardTime({ observedTime: 10, ratingFactor: 1.0, allowancePercent: 0 });
      expect(result.normalTime).toBe(10);
      expect(result.standardTime).toBe(10);
      expect(result.allowanceTime).toBe(0);
    });

    it('should handle maximum allowance', () => {
      const result = standardTime({ observedTime: 10, ratingFactor: 1.0, allowancePercent: 100 });
      expect(result.standardTime).toBe(20);
    });

    it('should handle maximum rating factor', () => {
      const result = standardTime({ observedTime: 5, ratingFactor: 2.0, allowancePercent: 10 });
      expect(result.normalTime).toBe(10);
      expect(result.standardTime).toBe(11);
    });
  });

  describe('validation', () => {
    it('should throw for observedTime <= 0', () => {
      expect(() => standardTime({ observedTime: 0, ratingFactor: 1.0, allowancePercent: 10 }))
        .toThrow(RangeError);
    });

    it('should throw for negative observedTime', () => {
      expect(() => standardTime({ observedTime: -5, ratingFactor: 1.0, allowancePercent: 10 }))
        .toThrow(RangeError);
    });

    it('should throw for ratingFactor <= 0', () => {
      expect(() => standardTime({ observedTime: 10, ratingFactor: 0, allowancePercent: 10 }))
        .toThrow(RangeError);
    });

    it('should throw for ratingFactor > 2', () => {
      expect(() => standardTime({ observedTime: 10, ratingFactor: 2.1, allowancePercent: 10 }))
        .toThrow(RangeError);
    });

    it('should throw for negative allowancePercent', () => {
      expect(() => standardTime({ observedTime: 10, ratingFactor: 1.0, allowancePercent: -5 }))
        .toThrow(RangeError);
    });

    it('should throw for allowancePercent > 100', () => {
      expect(() => standardTime({ observedTime: 10, ratingFactor: 1.0, allowancePercent: 101 }))
        .toThrow(RangeError);
    });

    it('should throw for NaN observedTime', () => {
      expect(() => standardTime({ observedTime: NaN, ratingFactor: 1.0, allowancePercent: 10 }))
        .toThrow(RangeError);
    });
  });
});
