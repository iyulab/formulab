import { describe, it, expect } from 'vitest';
import { ladderAngle } from './ladderAngle.js';

describe('ladderAngle', () => {
  describe('basic angle calculation', () => {
    it('should calculate angle from height and ladderLength', () => {
      const result = ladderAngle({
        ladderLength: 6,
        height: 5.8,
      });

      // baseDistance = √(36 - 33.64) = √2.36 = 1.536
      // angle = atan(5.8 / 1.536) ≈ 75.2°
      expect(result.angle).toBeCloseTo(75.2, 0);
      expect(result.baseDistance).toBeGreaterThan(0);
    });

    it('should calculate angle from baseDistance and ladderLength', () => {
      const result = ladderAngle({
        ladderLength: 6,
        baseDistance: 1.5,
      });

      // height = √(36 - 2.25) = √33.75 = 5.81
      // angle = atan(5.81 / 1.5) ≈ 75.5°
      expect(result.angle).toBeCloseTo(75.5, 0);
      expect(result.height).toBeGreaterThan(0);
    });

    it('should calculate from height and baseDistance (recalc ladderLength)', () => {
      const result = ladderAngle({
        ladderLength: 0, // will be overridden
        height: 4,
        baseDistance: 1,
      });

      // angle = atan(4/1) = 75.96°
      expect(result.angle).toBeCloseTo(75.96, 1);
      // ladderLength = √(16 + 1) = √17 = 4.123
      expect(result.ladderLength).toBeCloseTo(4.123, 2);
    });
  });

  describe('OSHA 4:1 compliance', () => {
    it('should be compliant at ideal 4:1 ratio', () => {
      const result = ladderAngle({
        ladderLength: 0,
        height: 4,
        baseDistance: 1,
      });

      // angle ≈ 75.96° → compliant (70-80)
      expect(result.isCompliant).toBe(true);
    });

    it('should be non-compliant at too shallow angle', () => {
      const result = ladderAngle({
        ladderLength: 0,
        height: 3,
        baseDistance: 2,
      });

      // angle = atan(3/2) = 56.3° → not compliant
      expect(result.isCompliant).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should be non-compliant at too steep angle', () => {
      const result = ladderAngle({
        ladderLength: 0,
        height: 6,
        baseDistance: 0.5,
      });

      // angle = atan(6/0.5) = 85.2° → too steep
      expect(result.isCompliant).toBe(false);
      expect(result.warnings.some(w => w.includes('steep'))).toBe(true);
    });

    it('should be compliant at 70° boundary', () => {
      // tan(70°) = 2.7475, so height/base = 2.7475
      const result = ladderAngle({
        ladderLength: 0,
        height: 2.7475,
        baseDistance: 1,
      });

      expect(result.angle).toBeCloseTo(70, 0);
      expect(result.isCompliant).toBe(true);
    });

    it('should be compliant at 80° boundary', () => {
      // tan(80°) = 5.671
      const result = ladderAngle({
        ladderLength: 0,
        height: 5.671,
        baseDistance: 1,
      });

      expect(result.isCompliant).toBe(true);
    });
  });

  describe('ideal base distance', () => {
    it('should calculate ideal base distance for 4:1 rule', () => {
      const result = ladderAngle({
        ladderLength: 0,
        height: 8,
        baseDistance: 2,
      });

      // idealBaseDistance = height / 4 = 8 / 4 = 2
      expect(result.idealBaseDistance).toBe(2);
    });
  });

  describe('reach height', () => {
    it('should calculate reach height as wall height + 1m', () => {
      const result = ladderAngle({
        ladderLength: 6,
        height: 5.8,
      });

      expect(result.reachHeight).toBeCloseTo(6.8, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle ladder length equal to height', () => {
      const result = ladderAngle({
        ladderLength: 5,
        height: 5,
      });

      // baseDistance would be 0 → angle = 90°
      expect(result.baseDistance).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle default (neither height nor baseDistance)', () => {
      const result = ladderAngle({
        ladderLength: 6,
      });

      // Uses OSHA ideal 75.5°
      expect(result.angle).toBeCloseTo(75.5, 0);
      expect(result.height).toBeGreaterThan(0);
      expect(result.baseDistance).toBeGreaterThan(0);
    });
  });
});
