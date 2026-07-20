import { describe, it, expect } from 'vitest';
import { vibration } from './vibration.js';

describe('vibration', () => {
  // Golden guard. The spring-mass frequency is pinned elsewhere, but the
  // Euler-Bernoulli beam path was only compared (mode ordering, stiff>soft), never
  // pinned to a value — a wrong lambda or a units slip in the EI/rhoA term would
  // survive. This pins the cantilever fundamental and section properties by hand.
  //
  // Steel cantilever, rectangular 20x10 mm, L=500 mm (E=200 GPa, rho=7850):
  //   I = w h^3 / 12 = 20*1000/12 = 1666.67 mm^4 ;  A = 200 mm^2
  //   EI/(rho A) = (200e9 * 1666.67e-12)/(7850 * 200e-6) = 333.33/1.57 = 212.31
  //   f1 = (1.875104^2 / (2 pi * 0.5^2)) * sqrt(212.31) = 32.62 Hz    (Euler-Bernoulli)
  //   higher modes scale as lambda_n^2, so f2/f1 = (4.694091/1.875104)^2.
  describe('golden values (Euler-Bernoulli cantilever, steel)', () => {
    it('should match the hand-derived fundamental frequency and section properties', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'steel',
        crossSection: 'rectangular',
        width: 20,
        height: 10,
        length: 500,
      });
      expect(result.momentOfInertia).toBeCloseTo(1666.67, 1);
      expect(result.crossSectionalArea).toBeCloseTo(200, 5);
      expect(result.frequencies[0].frequency).toBeCloseTo(32.62, 1);
      expect(
        result.frequencies[1].frequency / result.frequencies[0].frequency,
      ).toBeCloseTo((4.694091 / 1.875104) ** 2, 2);
    });
  });

  describe('spring-mass system', () => {
    it('should calculate natural frequency for spring-mass', () => {
      const result = vibration({
        system: 'springMass',
        material: 'steel',
        springConstant: 1000, // N/m
        mass: 1, // kg
      });

      expect(result.frequencies.length).toBe(1);
      // f = (1/2π) x sqrt(k/m) = (1/2π) x sqrt(1000/1) = 5.03 Hz
      expect(result.frequencies[0].frequency).toBeCloseTo(5.03, 0);
    });

    it('should increase frequency with stiffer spring', () => {
      const soft = vibration({
        system: 'springMass',
        material: 'steel',
        springConstant: 500,
        mass: 1,
      });

      const stiff = vibration({
        system: 'springMass',
        material: 'steel',
        springConstant: 2000,
        mass: 1,
      });

      expect(stiff.frequencies[0].frequency).toBeGreaterThan(soft.frequencies[0].frequency);
    });

    it('should decrease frequency with heavier mass', () => {
      const light = vibration({
        system: 'springMass',
        material: 'steel',
        springConstant: 1000,
        mass: 0.5,
      });

      const heavy = vibration({
        system: 'springMass',
        material: 'steel',
        springConstant: 1000,
        mass: 2,
      });

      expect(heavy.frequencies[0].frequency).toBeLessThan(light.frequencies[0].frequency);
    });
  });

  describe('cantilever beam', () => {
    it('should calculate multiple modes for cantilever', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'steel',
        length: 500,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
      });

      expect(result.frequencies.length).toBe(3);
      expect(result.frequencies[0].mode).toBe(1);
      expect(result.frequencies[1].mode).toBe(2);
      expect(result.frequencies[2].mode).toBe(3);
    });

    it('should have increasing frequencies for higher modes', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'steel',
        length: 500,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
      });

      expect(result.frequencies[1].frequency).toBeGreaterThan(result.frequencies[0].frequency);
      expect(result.frequencies[2].frequency).toBeGreaterThan(result.frequencies[1].frequency);
    });

    it('should calculate moment of inertia', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'steel',
        length: 500,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
      });

      // I = bh³/12 = 20 x 10³ / 12 = 1666.67 mm4
      expect(result.momentOfInertia).toBeCloseTo(1666.67, 0);
    });
  });

  describe('simply supported beam', () => {
    it('should calculate frequencies for simply supported beam', () => {
      const result = vibration({
        system: 'simplySupported',
        material: 'steel',
        length: 500,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
      });

      expect(result.frequencies.length).toBe(3);
    });

    it('should have higher first mode than cantilever of same size', () => {
      const cantilever = vibration({
        system: 'cantilever',
        material: 'steel',
        length: 500,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
      });

      const simple = vibration({
        system: 'simplySupported',
        material: 'steel',
        length: 500,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
      });

      expect(simple.frequencies[0].frequency).toBeGreaterThan(cantilever.frequencies[0].frequency);
    });
  });

  describe('circular cross section', () => {
    it('should calculate for circular shaft', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'steel',
        length: 400,
        crossSection: 'circular',
        diameter: 20,
      });

      expect(result.frequencies.length).toBe(3);
      expect(result.crossSectionalArea).toBeCloseTo(314.16, 0);
    });
  });

  describe('hollow cross section', () => {
    it('should calculate for hollow tube', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'steel',
        length: 400,
        crossSection: 'hollow',
        outerDiameter: 30,
        innerDiameter: 20,
      });

      expect(result.frequencies.length).toBe(3);
      expect(result.crossSectionalArea).toBeGreaterThan(0);
    });
  });

  describe('shaft-disk torsional vibration', () => {
    it('should calculate torsional frequency', () => {
      const result = vibration({
        system: 'shaftDisk',
        material: 'steel',
        length: 300,
        crossSection: 'circular',
        diameter: 25,
        diskMass: 5, // kg
        diskRadius: 100, // mm
      });

      expect(result.frequencies.length).toBe(1);
      expect(result.frequencies[0].frequency).toBeGreaterThan(0);
    });
  });

  describe('material properties', () => {
    it('should use steel properties', () => {
      const result = vibration({
        system: 'springMass',
        material: 'steel',
        springConstant: 1000,
        mass: 1,
      });

      expect(result.materialProps.E).toBe(200);
      expect(result.materialProps.rho).toBe(7850);
    });

    it('should use aluminum properties', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'aluminum',
        length: 500,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
      });

      expect(result.materialProps.E).toBe(69);
      expect(result.materialProps.rho).toBe(2700);
    });

    it('should use custom material properties', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'custom',
        length: 500,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
        youngsModulus: 100,
        density: 5000,
      });

      expect(result.materialProps.E).toBe(100);
      expect(result.materialProps.rho).toBe(5000);
    });
  });

  describe('edge cases', () => {
    it('should throw for invalid spring-mass', () => {
      expect(() => vibration({
        system: 'springMass',
        material: 'steel',
        springConstant: 0,
        mass: 1,
      })).toThrow(RangeError);
    });

    it('should throw for zero length beam', () => {
      expect(() => vibration({
        system: 'cantilever',
        material: 'steel',
        length: 0,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
      })).toThrow(RangeError);
    });

    it('should throw for invalid dimensions', () => {
      expect(() => vibration({
        system: 'cantilever',
        material: 'steel',
        length: 500,
        crossSection: 'rectangular',
        width: 0,
        height: 10,
      })).toThrow(RangeError);
    });
  });
});
