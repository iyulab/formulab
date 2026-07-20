import { describe, it, expect } from 'vitest';
import { weldStrength } from './weldStrength.js';

describe('weldStrength', () => {
  describe('geometry and capacity', () => {
    it('should compute throat as 0.707 x leg', () => {
      const r = weldStrength({ legSize: 8, weldLength: 100, electrode: 'E70', appliedLoad: 0 });
      expect(r.throat).toBeCloseTo(0.707 * 8, 3);
    });

    it('should scale effective area with weld count', () => {
      const one = weldStrength({ legSize: 6, weldLength: 100, weldCount: 1, electrode: 'E70', appliedLoad: 0 });
      const two = weldStrength({ legSize: 6, weldLength: 100, weldCount: 2, electrode: 'E70', appliedLoad: 0 });
      expect(two.effectiveArea).toBeCloseTo(2 * one.effectiveArea, 6);
      expect(two.allowableLoad).toBeCloseTo(2 * one.allowableLoad, 1);
    });

    it('should give a higher-strength electrode a larger allowable stress', () => {
      const e60 = weldStrength({ legSize: 6, weldLength: 100, electrode: 'E60', appliedLoad: 0 });
      const e110 = weldStrength({ legSize: 6, weldLength: 100, electrode: 'E110', appliedLoad: 0 });
      expect(e110.allowableShearStress).toBeGreaterThan(e60.allowableShearStress);
      expect(e110.allowableLoad).toBeGreaterThan(e60.allowableLoad);
    });

    it('should increase capacity (and lower utilization) with a larger leg', () => {
      const small = weldStrength({ legSize: 5, weldLength: 100, electrode: 'E70', appliedLoad: 40000 });
      const large = weldStrength({ legSize: 10, weldLength: 100, electrode: 'E70', appliedLoad: 40000 });
      expect(large.allowableLoad).toBeGreaterThan(small.allowableLoad);
      expect(large.utilization).toBeLessThan(small.utilization);
    });
  });

  describe('safety verdict', () => {
    it('should mark a within-capacity weld safe', () => {
      const r = weldStrength({ legSize: 6, weldLength: 100, electrode: 'E70', appliedLoad: 50000 });
      expect(r.utilization).toBeLessThan(1);
      expect(r.isSafe).toBe(true);
    });

    it('should mark an overloaded weld unsafe', () => {
      const r = weldStrength({ legSize: 6, weldLength: 100, electrode: 'E70', appliedLoad: 80000 });
      expect(r.utilization).toBeGreaterThan(1);
      expect(r.isSafe).toBe(false);
    });

    it('should treat a load exactly at capacity as safe (utilization = 1, boundary is inclusive)', () => {
      // Exact analytic capacity: Fw x Aw = (0.30 x 483) x (0.707 x 6 x 100) = 144.9 x 424.2.
      // Feed the exact value (not the rounded `allowableLoad` output, which would sit a
      // fraction above true capacity and correctly read as unsafe).
      const exactCapacity = 144.9 * 424.2;
      const r = weldStrength({ legSize: 6, weldLength: 100, electrode: 'E70', appliedLoad: exactCapacity });
      expect(r.utilization).toBeCloseTo(1, 4);
      expect(r.isSafe).toBe(true);
    });
  });

  describe('minRequiredLeg round-trip', () => {
    it('should return a leg that carries the applied load at ~unity utilization', () => {
      const r = weldStrength({ legSize: 6, weldLength: 100, electrode: 'E70', appliedLoad: 50000 });
      const check = weldStrength({ legSize: r.minRequiredLeg, weldLength: 100, electrode: 'E70', appliedLoad: 50000 });
      expect(check.utilization).toBeCloseTo(1, 3);
    });
  });

  describe('capacity-only query (appliedLoad = 0)', () => {
    it('should report zero demand and be trivially safe', () => {
      const r = weldStrength({ legSize: 6, weldLength: 100, electrode: 'E70', appliedLoad: 0 });
      expect(r.actualStress).toBe(0);
      expect(r.utilization).toBe(0);
      expect(r.minRequiredLeg).toBe(0);
      expect(r.isSafe).toBe(true);
      expect(r.allowableLoad).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should throw for non-positive leg', () => {
      expect(() => weldStrength({ legSize: 0, weldLength: 100, electrode: 'E70', appliedLoad: 0 })).toThrow(RangeError);
    });
    it('should throw for non-positive length', () => {
      expect(() => weldStrength({ legSize: 6, weldLength: 0, electrode: 'E70', appliedLoad: 0 })).toThrow(RangeError);
    });
    it('should throw for weldCount below 1', () => {
      expect(() => weldStrength({ legSize: 6, weldLength: 100, weldCount: 0, electrode: 'E70', appliedLoad: 0 })).toThrow(RangeError);
    });
    it('should throw for negative applied load', () => {
      expect(() => weldStrength({ legSize: 6, weldLength: 100, electrode: 'E70', appliedLoad: -1 })).toThrow(RangeError);
    });
  });

  // Golden-value regression guard. The tests above are qualitative (sign, monotonicity,
  // round-trip) and cannot tell a correct AISC ASD model from a wrong constant. This one
  // pins every output to values derived BY HAND from AISC ASD for an equal-leg fillet, so
  // it fails if the throat factor (0.707), the ASD factor (0.30), or the E70 FEXX (483 MPa)
  // regresses.
  //
  // Derivation (E70, leg 6 mm, L 100 mm, n 1, applied P = 50 000 N):
  //   throat     = 0.707 x 6            = 4.242 mm
  //   Aw         = 4.242 x 100 x 1      = 424.2 mm^2
  //   Fw         = 0.30 x 483           = 144.9 MPa      (E70 -> 0.30 x 70 ksi = 21 ksi)
  //   Pallow     = 144.9 x 424.2        = 61 466.6 N
  //   tau        = 50 000 / 424.2       = 117.87 MPa
  //   util       = 50 000 / 61 466.58   = 0.8135
  //   leg_min    = 50 000 / (144.9 x 0.707 x 100 x 1) = 50 000 / 10 244.43 = 4.881 mm
  describe('golden values (AISC ASD equal-leg fillet, E70)', () => {
    const sample = { legSize: 6, weldLength: 100, weldCount: 1, electrode: 'E70' as const, appliedLoad: 50000 };

    it('should match the hand-derived geometry and capacity', () => {
      const r = weldStrength(sample);
      expect(r.throat).toBeCloseTo(4.242, 3);
      expect(r.effectiveArea).toBeCloseTo(424.2, 1);
      expect(r.allowableShearStress).toBeCloseTo(144.9, 2);
      expect(r.allowableLoad).toBeCloseTo(61466.6, 0);
    });

    it('should match the hand-derived demand and required leg', () => {
      const r = weldStrength(sample);
      expect(r.actualStress).toBeCloseTo(117.87, 2);
      expect(r.utilization).toBeCloseTo(0.8135, 4);
      expect(r.minRequiredLeg).toBeCloseTo(4.881, 3);
    });
  });
});
