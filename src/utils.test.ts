import { describe, it, expect } from 'vitest';
import { roundTo } from './utils.js';

describe('roundTo', () => {
  describe('basic rounding', () => {
    it('should round to 2 decimal places by default', () => {
      expect(roundTo(3.14159)).toBe(3.14);
      expect(roundTo(2.5)).toBe(2.5);
      expect(roundTo(2.555)).toBe(2.56);
    });

    it('should round to specified decimal places', () => {
      expect(roundTo(3.14159, 0)).toBe(3);
      expect(roundTo(3.14159, 1)).toBe(3.1);
      expect(roundTo(3.14159, 3)).toBe(3.142);
      expect(roundTo(3.14159, 4)).toBe(3.1416);
    });

    it('should handle negative numbers', () => {
      expect(roundTo(-3.14159, 2)).toBe(-3.14);
      expect(roundTo(-2.555, 2)).toBe(-2.56);
    });
  });

  describe('floating-point precision fixes', () => {
    it('should correctly round 0.615 to 0.62 (not 0.61)', () => {
      // This is a classic floating-point precision issue
      // 0.615 * 100 = 61.49999999999999 in IEEE 754
      expect(roundTo(0.615, 2)).toBe(0.62);
    });

    it('should correctly round 1.005 to 1.01 (not 1.00)', () => {
      expect(roundTo(1.005, 2)).toBe(1.01);
    });

    it('should correctly round 2.675 to 2.68 (not 2.67)', () => {
      expect(roundTo(2.675, 2)).toBe(2.68);
    });

    it('should handle small decimal values', () => {
      expect(roundTo(0.000015, 5)).toBe(0.00002);
      expect(roundTo(0.000014, 5)).toBe(0.00001);
    });
  });

  describe('edge cases', () => {
    it('should return NaN for NaN input', () => {
      expect(roundTo(NaN, 2)).toBeNaN();
    });

    it('should return Infinity for Infinity input', () => {
      expect(roundTo(Infinity, 2)).toBe(Infinity);
      expect(roundTo(-Infinity, 2)).toBe(-Infinity);
    });

    it('should handle zero', () => {
      expect(roundTo(0, 2)).toBe(0);
      expect(roundTo(-0, 2)).toBe(0);
    });

    it('should handle very large numbers', () => {
      expect(roundTo(1234567890.123456, 2)).toBe(1234567890.12);
    });

    it('should handle very small numbers', () => {
      expect(roundTo(0.0000001, 6)).toBe(0);
      expect(roundTo(0.0000001, 7)).toBe(0.0000001);
    });
  });

  describe('integer rounding', () => {
    it('should round to integers when decimals is 0', () => {
      expect(roundTo(3.4, 0)).toBe(3);
      expect(roundTo(3.5, 0)).toBe(4);
      expect(roundTo(3.6, 0)).toBe(4);
    });
  });
});
