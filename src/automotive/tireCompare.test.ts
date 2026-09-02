import { describe, it, expect } from 'vitest';
import { tireCompare, tireLoadCapacityKg } from './tireCompare.js';

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

  // docket iyulab/online-tools ISSUE-formulab (NT-157): EV load-index / HL support.
  // Golden values cross-verified against ISO 4000-1 (via en.wikipedia.org/wiki/Tire_code, cell
  // extraction 2026-09-02), the UK MOT Inspection Manual Appendix B (÷2, different reference
  // pressure class but consistent ratio), and published XL/HL comparison figures.
  describe('tireLoadCapacityKg (ISO 4000-1 / ETRTO Load Index)', () => {
    it('matches published golden reference points', () => {
      expect(tireLoadCapacityKg(70)).toBe(335);
      expect(tireLoadCapacityKg(91)).toBe(615); // commonly-cited passenger-tire reference value
      expect(tireLoadCapacityKg(98)).toBe(750); // XL example from Continental's HL announcement
      expect(tireLoadCapacityKg(100)).toBe(800);
      expect(tireLoadCapacityKg(101)).toBe(825); // HL example — same table, no separate HL column
      expect(tireLoadCapacityKg(126)).toBe(1700); // heavy EV pickup range (e.g. Hummer EV XL)
    });

    it('throws for an index below the supported range', () => {
      expect(() => tireLoadCapacityKg(59)).toThrow(RangeError);
    });

    it('throws for an index above the supported range', () => {
      expect(() => tireLoadCapacityKg(131)).toThrow(RangeError);
    });

    it('accepts both boundary values', () => {
      expect(tireLoadCapacityKg(60)).toBe(250);
      expect(tireLoadCapacityKg(130)).toBe(1900);
    });
  });

  describe('load capacity comparison (via tireCompare)', () => {
    it('omits load capacity fields when neither spec supplies loadIndex', () => {
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16 },
        tire2: { width: 215, aspect: 55, rim: 16 },
      });
      expect(result.tire1.maxLoadKg).toBeUndefined();
      expect(result.loadCapacityDiffKg).toBeUndefined();
      expect(result.loadCapacityReduced).toBeUndefined();
    });

    it('reports maxLoadKg for the one spec with loadIndex but omits the diff when only one is supplied', () => {
      const result = tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16, loadIndex: 91 },
        tire2: { width: 215, aspect: 55, rim: 16 },
      });
      expect(result.tire1.maxLoadKg).toBe(615);
      expect(result.tire2.maxLoadKg).toBeUndefined();
      expect(result.loadCapacityDiffKg).toBeUndefined();
      expect(result.loadCapacityReduced).toBeUndefined();
    });

    it('reports each maxLoadKg and the diff when both specs supply loadIndex', () => {
      const result = tireCompare({
        tire1: { width: 245, aspect: 45, rim: 19, loadIndex: 98 },
        tire2: { width: 245, aspect: 45, rim: 19, loadIndex: 101 },
      });
      expect(result.tire1.maxLoadKg).toBe(750);
      expect(result.tire2.maxLoadKg).toBe(825);
      expect(result.loadCapacityDiffKg).toBe(75);
      expect(result.loadCapacityReduced).toBe(false);
    });

    it('flags loadCapacityReduced when the replacement tire is rated to carry less', () => {
      // Real-world safety check: swapping to a lower-load-index tire than the OEM spec.
      const result = tireCompare({
        tire1: { width: 275, aspect: 65, rim: 18, loadIndex: 123 }, // OEM heavy EV pickup spec
        tire2: { width: 275, aspect: 65, rim: 18, loadIndex: 116 }, // undersized replacement
      });
      expect(result.loadCapacityDiffKg).toBeLessThan(0);
      expect(result.loadCapacityReduced).toBe(true);
    });

    it('propagates the RangeError when a supplied loadIndex is out of range', () => {
      expect(() => tireCompare({
        tire1: { width: 205, aspect: 55, rim: 16, loadIndex: 50 },
        tire2: { width: 205, aspect: 55, rim: 16 },
      })).toThrow(RangeError);
    });
  });
});
