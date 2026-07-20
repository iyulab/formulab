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
    it('should throw for invalid dimensions', () => {
      expect(() => pressFit({
        shaftDiameter: 0,
        holeDiameter: 25.00,
        hubOuterDiameter: 50,
        contactLength: 30,
        youngsModulus: 200,
        poissonRatio: 0.3,
        frictionCoefficient: 0.15,
      })).toThrow();
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

  // Golden-value regression guard. Every other test above is qualitative
  // (>0, sign, monotonicity, range) and so cannot tell a correct C-factor from a
  // wrong one. This one pins the interface pressure (and derived force/torque) to
  // a value derived BY HAND from Shigley's same-material, solid-shaft interference
  // equation, so it fails if the physics regresses.
  //
  // Derivation (steel-on-steel, solid shaft, d_o = 100):
  //   delta = 50.025 - 50.000 = 0.025 mm
  //   d     = (50.025 + 50.000) / 2 = 50.0125 mm      (code uses the average)
  //   E     = 210 GPa = 210_000 MPa
  //   ratio = (d_o^2 + d^2)/(d_o^2 - d^2)
  //         = (10000 + 2501.2502)/(10000 - 2501.2502) = 1.667111
  //   C     = ratio + 1 = 2.667111                    (+1, NOT +nu — the shaft yields too)
  //   p     = delta * E / (d * C) = 5250 / 133.3889 = 39.36 MPa
  //   F     = pi * d * L * p * mu = 46.38 kN
  //   T     = pi * d^2 * L * p * mu / 2 / 1000 = 1160 N*m
  //
  // The superseded rigid-shaft model (C = ratio + nu) gave p = 53.4 MPa / F = 62.88 kN,
  // ~36% too high; the tolerances below are tight enough to reject those values.
  describe('golden values (Shigley same-material solid shaft)', () => {
    const sample = {
      shaftDiameter: 50.025,
      holeDiameter: 50.000,
      hubOuterDiameter: 100,
      contactLength: 50,
      youngsModulus: 210,
      poissonRatio: 0.3,
      frictionCoefficient: 0.15,
    };

    it('should match the hand-derived Shigley interface pressure (39.36 MPa)', () => {
      expect(pressFit(sample).interfacePressure).toBeCloseTo(39.36, 1);
    });

    it('should match the hand-derived assembly force (46.38 kN) and holding torque (1160 N*m)', () => {
      const result = pressFit(sample);
      expect(result.assemblyForceKN).toBeCloseTo(46.38, 1);
      expect(result.holdingTorque).toBeCloseTo(1160, -1); // within ~5 N*m
    });

    it('should be independent of Poisson ratio (nu cancels for same-material solid shaft)', () => {
      const withLowNu = pressFit({ ...sample, poissonRatio: 0.1 });
      const withHighNu = pressFit({ ...sample, poissonRatio: 0.45 });
      expect(withLowNu.interfacePressure).toBe(withHighNu.interfacePressure);
    });
  });
});
