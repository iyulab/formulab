import { describe, it, expect } from 'vitest';
import { pressFit } from './pressFit.js';

describe('pressFit', () => {
  describe('interference calculation', () => {
    it('should calculate interference from shaft and hole diameters', () => {
      const result = pressFit({
        shaftDiameter: 25.05,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200, // GPa
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.interference).toBeCloseTo(0.05, 3);
    });
  });

  describe('interface pressure', () => {
    it('should calculate interface pressure', () => {
      const result = pressFit({
        shaftDiameter: 25.05,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.interfacePressure).toBeGreaterThan(0);
    });

    it('should increase pressure with larger interference', () => {
      const small = pressFit({
        shaftDiameter: 25.02,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      const large = pressFit({
        shaftDiameter: 25.08,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(large.interfacePressure).toBeGreaterThan(small.interfacePressure);
    });
  });

  describe('assembly force', () => {
    it('should calculate assembly force', () => {
      const result = pressFit({
        shaftDiameter: 25.05,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.assemblyForce).toBeGreaterThan(0);
      expect(result.assemblyForceKN).toBeCloseTo(result.assemblyForce / 1000, 2);
    });

    it('should increase force with longer contact length', () => {
      const short = pressFit({
        shaftDiameter: 25.05,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 20,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      const long = pressFit({
        shaftDiameter: 25.05,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 50,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(long.assemblyForce).toBeGreaterThan(short.assemblyForce);
    });
  });

  describe('holding torque', () => {
    it('should calculate holding torque', () => {
      const result = pressFit({
        shaftDiameter: 25.05,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.holdingTorque).toBeGreaterThan(0);
    });
  });

  describe('stress calculations', () => {
    it('should calculate hub hoop stress', () => {
      const result = pressFit({
        shaftDiameter: 25.05,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.hubHoopStress).toBeGreaterThan(0);
    });

    it('should calculate shaft radial stress (compressive)', () => {
      const result = pressFit({
        shaftDiameter: 25.05,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.shaftRadialStress).toBeLessThan(0); // Compressive
    });
  });

  describe('edge cases', () => {
    it('should return zeros for invalid dimensions', () => {
      const result = pressFit({
        shaftDiameter: 0,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.interference).toBe(0);
      expect(result.interfacePressure).toBe(0);
    });

    it('should return zeros when hub OD <= shaft diameter', () => {
      const result = pressFit({
        shaftDiameter: 50,
        holeDiameter: 49.95,
        hubOuterDiameter: 50, // Equal to shaft
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.interfacePressure).toBe(0);
    });

    it('should handle clearance fit (no interference)', () => {
      const result = pressFit({
        shaftDiameter: 24.95, // Smaller than hole
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.interference).toBeLessThan(0);
      expect(result.interfacePressure).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate bearing press fit', () => {
      const result = pressFit({
        shaftDiameter: 30.02,
        holeDiameter: 30.00,
        hubOuterDiameter: 55,
        contactLength: 15,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.12,
      });

      expect(result.assemblyForceKN).toBeGreaterThan(0);
      expect(result.assemblyForceKN).toBeLessThan(100);
    });

    it('should calculate gear hub press fit', () => {
      const result = pressFit({
        shaftDiameter: 40.05,
        holeDiameter: 40.00,
        hubOuterDiameter: 80,
        contactLength: 50,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      });

      expect(result.holdingTorque).toBeGreaterThan(0);
    });
  });
});
