import { describe, it, expect } from 'vitest';
import { tireCompare } from './tireCompare.js';

describe('tireCompare', () => {
  describe('tire dimension calculation', () => {
    it('should calculate diameter correctly', () => {
      // 205/55R16: sidewall = 205 × 0.55 = 112.75mm
      // diameter = 16" × 25.4 + 2 × 112.75 = 406.4 + 225.5 = 631.9mm
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },
        tire2: { width: 205, aspect: 55, rim: 16 },
      });

      expect(result.tire1.diameter).toBeCloseTo(631.9, 0);
    });

    it('should calculate circumference correctly', () => {
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },
        tire2: { width: 205, aspect: 55, rim: 16 },
      });

      // Circumference = 631.9 × π ≈ 1985mm
      expect(result.tire1.circumference).toBeCloseTo(1985, 0);
    });

    it('should calculate revolutions per km correctly', () => {
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },
        tire2: { width: 205, aspect: 55, rim: 16 },
      });

      // Revs = 1,000,000 / 1985 ≈ 504
      expect(result.tire1.revsPerKm).toBeCloseTo(504, 0);
    });
  });

  describe('tire comparison', () => {
    it('should calculate diameter difference correctly', () => {
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },
        tire2: { width: 225, aspect: 45, rim: 17 },
      });

      // Tire1: 631.9mm, Tire2: 634.3mm
      expect(result.diameterDiff).toBeCloseTo(2.4, 0);
    });

    it('should calculate diameter difference percent correctly', () => {
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },
        tire2: { width: 225, aspect: 45, rim: 17 },
      });

      // Diff% = 2.4 / 631.9 × 100 ≈ 0.38%
      expect(result.diameterDiffPercent).toBeCloseTo(0.38, 1);
    });

    it('should calculate speedometer correction', () => {
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },
        tire2: { width: 225, aspect: 45, rim: 17 },
      });

      // Speedo correction = -diameterDiff%
      // Larger tire means speedo reads lower than actual
      expect(result.speedoCorrection).toBeCloseTo(-0.38, 1);
    });
  });

  describe('same size comparison', () => {
    it('should return zero differences for same size', () => {
      const result = tireCompare({
        tire1: { width: 225, aspect: 50, rim: 17 },
        tire2: { width: 225, aspect: 50, rim: 17 },
      });

      expect(result.diameterDiff).toBe(0);
      expect(result.diameterDiffPercent).toBe(0);
      expect(result.speedoCorrection).toBe(0);
    });
  });

  describe('plus sizing scenarios', () => {
    it('should calculate plus-one sizing', () => {
      // Plus-one: increase rim by 1", decrease aspect to maintain diameter
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },
        tire2: { width: 215, aspect: 50, rim: 17 },
      });

      // Plus sizing aims to maintain similar diameter but not exact
      // 205/55R16 = 631.9mm, 215/50R17 = 646.8mm (15mm difference)
      expect(Math.abs(result.diameterDiff)).toBeLessThan(20);
    });

    it('should calculate plus-two sizing', () => {
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },
        tire2: { width: 225, aspect: 45, rim: 18 },
      });

      // Tire2: 225×0.45×2 + 18×25.4 = 202.5 + 457.2 = 659.7mm
      expect(result.tire2.diameter).toBeCloseTo(659.7, 0);
    });
  });

  describe('real-world tire comparisons', () => {
    it('should compare OEM to aftermarket', () => {
      // Honda Civic OEM vs aftermarket
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },  // OEM
        tire2: { width: 215, aspect: 55, rim: 16 },  // Wider aftermarket
      });

      // Wider tire = taller sidewall = larger diameter
      expect(result.diameterDiff).toBeGreaterThan(0);
      expect(result.tire2.diameter).toBeGreaterThan(result.tire1.diameter);
    });

    it('should compare winter to summer tires', () => {
      // Same size comparison
      const result = tireCompare({
        tire1: { width: 225, aspect: 45, rim: 18 },
        tire2: { width: 225, aspect: 45, rim: 18 },
      });

      expect(result.tire1.diameter).toBe(result.tire2.diameter);
    });

    it('should compare truck tires', () => {
      const result = tireCompare({
        tire1: { width: 265, aspect: 70, rim: 17 },  // Stock
        tire2: { width: 285, aspect: 75, rim: 17 },  // Lift kit
      });

      expect(result.tire2.diameter).toBeGreaterThan(result.tire1.diameter);
      // Larger tire = speedo reads lower
      expect(result.speedoCorrection).toBeLessThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle low profile tires', () => {
      const result = tireCompare({
        tire1: { width: 255, aspect: 30, rim: 20 },
        tire2: { width: 255, aspect: 35, rim: 19 },
      });

      expect(result.tire1.diameter).toBeGreaterThan(0);
      expect(result.tire2.diameter).toBeGreaterThan(0);
    });

    it('should handle high aspect ratio tires', () => {
      const result = tireCompare({
        tire1: { width: 185, aspect: 80, rim: 14 },
        tire2: { width: 185, aspect: 75, rim: 14 },
      });

      // Higher aspect = larger diameter
      expect(result.tire1.diameter).toBeGreaterThan(result.tire2.diameter);
    });
  });
});
