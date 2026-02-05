import { describe, it, expect } from 'vitest';
import { vibration } from './vibration.js';

describe('vibration', () => {
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
    it('should return empty for invalid spring-mass', () => {
      const result = vibration({
        system: 'springMass',
        material: 'steel',
        springConstant: 0,
        mass: 1,
      });

      expect(result.frequencies.length).toBe(0);
    });

    it('should return empty for zero length beam', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'steel',
        length: 0,
        crossSection: 'rectangular',
        width: 20,
        height: 10,
      });

      expect(result.frequencies.length).toBe(0);
    });

    it('should return empty for invalid dimensions', () => {
      const result = vibration({
        system: 'cantilever',
        material: 'steel',
        length: 500,
        crossSection: 'rectangular',
        width: 0,
        height: 10,
      });

      expect(result.frequencies.length).toBe(0);
    });
  });
});
