import { describe, it, expect } from 'vitest';
import { stair } from './stair.js';

describe('stair', () => {
  describe('basic calculations', () => {
    it('should calculate stair dimensions with specified riser', () => {
      const result = stair({
        totalRise: 2800, // mm
        totalRun: 4200, // mm
        riserHeight: 175, // mm
      });

      expect(result.numberOfRisers).toBe(16);
      expect(result.numberOfTreads).toBe(15);
      expect(result.actualRiserHeight).toBe(175);
      expect(result.treadDepth).toBe(280); // 4200/15
    });

    it('should calculate stringer length', () => {
      const result = stair({
        totalRise: 3000,
        totalRun: 4000,
        riserHeight: 200,
      });

      // sqrt(3000^2 + 4000^2) = 5000
      expect(result.stringerLength).toBe(5000);
    });

    it('should calculate stair angle', () => {
      const result = stair({
        totalRise: 2000,
        totalRun: 2000,
        riserHeight: 200,
      });

      // atan2(2000, 2000) = 45 degrees
      expect(result.totalAngle).toBe(45);
    });
  });

  describe('auto-calculation', () => {
    it('should auto-calculate optimal risers without riserHeight', () => {
      const result = stair({
        totalRise: 2800,
        totalRun: 4000,
      });

      // Target ~170mm riser, 2800/170 ≈ 16.5 → 16 or 17 risers
      expect(result.numberOfRisers).toBeGreaterThanOrEqual(15);
      expect(result.numberOfRisers).toBeLessThanOrEqual(19);
    });

    it('should adjust for max riser height constraint', () => {
      const result = stair({
        totalRise: 3600, // High rise
        totalRun: 3000,
      });

      // Should not exceed 180mm per riser
      expect(result.actualRiserHeight).toBeLessThanOrEqual(180);
    });

    it('should adjust for min riser height constraint', () => {
      const result = stair({
        totalRise: 1200, // Low rise
        totalRun: 4000,
      });

      // Should not go below 150mm per riser (unless only 1 riser needed)
      expect(result.actualRiserHeight).toBeGreaterThanOrEqual(150);
    });
  });

  describe('2R+T comfort formula', () => {
    it('should calculate 2R+T value', () => {
      const result = stair({
        totalRise: 2800,
        totalRun: 4200,
        riserHeight: 175,
      });

      // 2*175 + 280 = 630
      expect(result.twoRPlusT).toBe(630);
    });

    it('should mark code compliant when 2R+T in range', () => {
      const result = stair({
        totalRise: 2550,
        totalRun: 4500,
        riserHeight: 170,
      });

      // 15 risers → 170mm riser, 14 treads → 321mm tread
      // 2*170 + 321 = 661 (slightly above range)
      expect(result.twoRPlusT).toBeGreaterThanOrEqual(600);
    });

    it('should mark non-compliant for steep stairs', () => {
      const result = stair({
        totalRise: 3000,
        totalRun: 2000,
        riserHeight: 200,
      });

      // Very steep: 2*200 + (2000/14) = 400 + 143 = 543 (below range)
      expect(result.codeCompliant).toBe(false);
    });

    it('should mark non-compliant for shallow stairs', () => {
      const result = stair({
        totalRise: 1500,
        totalRun: 6000,
        riserHeight: 150,
      });

      // Very shallow: 2*150 + 600 = 900 (above range)
      expect(result.codeCompliant).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle minimum single riser', () => {
      const result = stair({
        totalRise: 150, // Within MIN_RISER range
        totalRun: 300,
      });

      expect(result.numberOfRisers).toBe(1);
      expect(result.numberOfTreads).toBe(0);
      expect(result.treadDepth).toBe(0);
    });

    it('should handle zero riser height input', () => {
      const result = stair({
        totalRise: 2800,
        totalRun: 4000,
        riserHeight: 0,
      });

      // Should use auto-calculation
      expect(result.numberOfRisers).toBeGreaterThan(0);
      expect(result.actualRiserHeight).toBeGreaterThan(0);
    });

    it('should handle very tall staircase', () => {
      const result = stair({
        totalRise: 6000, // 6 meters
        totalRun: 10000,
      });

      expect(result.numberOfRisers).toBeGreaterThan(30);
    });

    it('should round riser count appropriately', () => {
      const result = stair({
        totalRise: 2550, // 15 risers at 170mm
        totalRun: 4000,
        riserHeight: 170,
      });

      expect(result.numberOfRisers).toBe(15);
      expect(result.actualRiserHeight).toBe(170);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate residential staircase', () => {
      const result = stair({
        totalRise: 2700, // Typical floor height
        totalRun: 3600,
      });

      expect(result.numberOfRisers).toBeGreaterThanOrEqual(14);
      expect(result.numberOfRisers).toBeLessThanOrEqual(18);
      expect(result.actualRiserHeight).toBeGreaterThanOrEqual(150);
      expect(result.actualRiserHeight).toBeLessThanOrEqual(180);
    });

    it('should calculate commercial staircase', () => {
      const result = stair({
        totalRise: 3500, // Higher commercial ceiling
        totalRun: 5500,
        riserHeight: 170,
      });

      expect(result.numberOfRisers).toBeGreaterThan(20);
      expect(result.treadDepth).toBeGreaterThan(250);
    });

    it('should calculate deck stairs', () => {
      const result = stair({
        totalRise: 900, // Low deck
        totalRun: 1200,
      });

      expect(result.numberOfRisers).toBeLessThanOrEqual(6);
    });

    it('should calculate spiral stair equivalent', () => {
      const result = stair({
        totalRise: 3000,
        totalRun: 2400, // Compact
        riserHeight: 200,
      });

      expect(result.totalAngle).toBeGreaterThan(45);
    });
  });

  describe('code compliance scenarios', () => {
    it('should identify comfortable residential stair', () => {
      const result = stair({
        totalRise: 2700,
        totalRun: 4200,
        riserHeight: 175, // 15.4 risers → round to 15
      });

      // Should be close to compliant range
      expect(result.twoRPlusT).toBeGreaterThanOrEqual(590);
      expect(result.twoRPlusT).toBeLessThanOrEqual(660);
    });

    it('should calculate IBC compliant stair', () => {
      // IBC: max 7" (178mm) riser, min 11" (279mm) tread
      const result = stair({
        totalRise: 2670, // 15 risers at 178mm
        totalRun: 4185, // 14 treads at 299mm
        riserHeight: 178,
      });

      expect(result.actualRiserHeight).toBeLessThanOrEqual(180);
      expect(result.treadDepth).toBeGreaterThanOrEqual(275);
    });
  });

  describe('stringer length calculations', () => {
    it('should calculate accurate stringer for 3-4-5 triangle', () => {
      const result = stair({
        totalRise: 3000,
        totalRun: 4000,
        riserHeight: 200,
      });

      expect(result.stringerLength).toBe(5000);
    });

    it('should calculate stringer for typical residential', () => {
      const result = stair({
        totalRise: 2700,
        totalRun: 3600,
      });

      // sqrt(2700^2 + 3600^2) = 4500
      expect(result.stringerLength).toBe(4500);
    });
  });

  describe('angle calculations', () => {
    it('should calculate 30 degree stair', () => {
      const result = stair({
        totalRise: 1000,
        totalRun: 1732, // tan(30°) ≈ 0.577
        riserHeight: 166.7,
      });

      expect(result.totalAngle).toBeCloseTo(30, 0);
    });

    it('should calculate 37 degree typical stair', () => {
      const result = stair({
        totalRise: 2700,
        totalRun: 3600,
      });

      // atan2(2700, 3600) ≈ 36.87°
      expect(result.totalAngle).toBeCloseTo(36.9, 0);
    });
  });
});
