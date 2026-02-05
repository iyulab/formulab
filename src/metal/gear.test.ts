import { describe, it, expect } from 'vitest';
import { gear } from './gear.js';

describe('gear', () => {
  describe('fromModule mode', () => {
    it('should calculate gear geometry from module and teeth', () => {
      const result = gear({
        mode: 'fromModule',
        module: 2,
        teethGear1: 20,
      });

      expect(result.module).toBe(2);
      expect(result.pitchDiameter1).toBe(40); // m x z = 2 x 20
      expect(result.addendum).toBe(2); // ha = m
      expect(result.dedendum).toBe(2.5); // hf = 1.25m
    });

    it('should calculate circular pitch', () => {
      const result = gear({
        mode: 'fromModule',
        module: 2,
        teethGear1: 20,
      });

      // p = pi x m = 3.14159 x 2 = 6.283
      expect(result.circularPitch).toBeCloseTo(6.283, 2);
    });

    it('should calculate base circle diameter', () => {
      const result = gear({
        mode: 'fromModule',
        module: 2,
        teethGear1: 20,
      });

      // db = d x cos(20°) = 40 x 0.9397 = 37.59
      expect(result.baseCircleDiameter1).toBeCloseTo(37.59, 1);
    });
  });

  describe('gear pair calculations', () => {
    it('should calculate center distance for gear pair', () => {
      const result = gear({
        mode: 'fromModule',
        module: 2,
        teethGear1: 20,
        teethGear2: 40,
      });

      // Center distance = (z1 + z2) x m / 2 = 60 x 2 / 2 = 60
      expect(result.centerDistance).toBe(60);
    });

    it('should calculate second gear pitch diameter', () => {
      const result = gear({
        mode: 'fromModule',
        module: 2,
        teethGear1: 20,
        teethGear2: 40,
      });

      expect(result.pitchDiameter2).toBe(80); // m x z2 = 2 x 40
    });
  });

  describe('fromPitchDiameter mode', () => {
    it('should calculate module from pitch diameter and teeth', () => {
      const result = gear({
        mode: 'fromPitchDiameter',
        pitchDiameter: 60,
        numberOfTeeth: 30,
      });

      expect(result.module).toBe(2); // d / z = 60 / 30
      expect(result.pitchDiameter1).toBe(60);
    });
  });

  describe('edge cases', () => {
    it('should return empty result for invalid module', () => {
      const result = gear({
        mode: 'fromModule',
        module: 0,
        teethGear1: 20,
      });

      expect(result.module).toBe(0);
      expect(result.pitchDiameter1).toBe(0);
    });

    it('should return empty result for invalid teeth count', () => {
      const result = gear({
        mode: 'fromModule',
        module: 2,
        teethGear1: 0,
      });

      expect(result.module).toBe(0);
    });

    it('should return empty result for invalid pitch diameter', () => {
      const result = gear({
        mode: 'fromPitchDiameter',
        pitchDiameter: 0,
        numberOfTeeth: 20,
      });

      expect(result.module).toBe(0);
    });

    it('should not include second gear data when not specified', () => {
      const result = gear({
        mode: 'fromModule',
        module: 2,
        teethGear1: 20,
      });

      expect(result.pitchDiameter2).toBeUndefined();
      expect(result.centerDistance).toBeUndefined();
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate automotive transmission gear', () => {
      const result = gear({
        mode: 'fromModule',
        module: 3,
        teethGear1: 17,
        teethGear2: 43,
      });

      expect(result.pitchDiameter1).toBe(51);
      expect(result.pitchDiameter2).toBe(129);
      expect(result.centerDistance).toBe(90);
    });

    it('should calculate small mechanism gear', () => {
      const result = gear({
        mode: 'fromModule',
        module: 0.5,
        teethGear1: 12,
      });

      expect(result.pitchDiameter1).toBe(6);
      expect(result.addendum).toBe(0.5);
    });
  });
});
