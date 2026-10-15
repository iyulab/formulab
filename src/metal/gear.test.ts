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
    it.each([
      [{ mode: 'fromModule', module: 0, teethGear1: 20 }, /module must be greater than 0/],
      [{ mode: 'fromModule', module: 2, teethGear1: 0 }, /teethGear1 must be greater than 0/],
      [{ mode: 'fromModule', module: 2, teethGear1: 20, teethGear2: 0 }, /teethGear2/],
      [{ mode: 'fromPitchDiameter', pitchDiameter: 0, numberOfTeeth: 20 }, /pitchDiameter must be greater than 0/],
      [{ mode: 'fromPitchDiameter', pitchDiameter: 40 }, /numberOfTeeth must be greater than 0/],
    ] as const)('rejects %o instead of describing a 0 mm gear', (input, message) => {
      expect(() => gear(input)).toThrow(message);
    });

    it('should not include second gear data when not specified', () => {
      const result = gear({
        mode: 'fromModule',
        module: 2,
        teethGear1: 20,
      });

      expect(result.pitchDiameter2).toBeUndefined();
      expect(result.centerDistance).toBeUndefined();
      expect(result.tipDiameter2).toBeUndefined();
      expect(result.rootDiameter2).toBeUndefined();
      expect(result.baseCircleDiameter2).toBeUndefined();
    });

    it.each([
      [{ mode: 'fromModule', module: 2, teethGear1: 2.5 }, /teethGear1 must be greater than 2.5/],
      [{ mode: 'fromModule', module: 2, teethGear1: 20, teethGear2: 2 }, /teethGear2 must be greater than 2.5/],
      [{ mode: 'fromPitchDiameter', pitchDiameter: 4, numberOfTeeth: 2 }, /numberOfTeeth must be greater than 2.5/],
    ] as const)('rejects %o — the root circle m(z - 2.5) would not exist', (input, message) => {
      expect(() => gear(input)).toThrow(message);
    });
  });

  describe('tip and root circles', () => {
    // ISO 21771 standard basic rack: ha = m, hf = 1.25 m → da = m(z + 2), df = m(z - 2.5).
    it('gives both gears of a pair their tip, root and base circles', () => {
      const r = gear({ mode: 'fromModule', module: 2, teethGear1: 20, teethGear2: 40 });
      expect(r.tipDiameter1).toBe(44);
      expect(r.rootDiameter1).toBe(35);
      expect(r.tipDiameter2).toBe(84);
      expect(r.rootDiameter2).toBe(75);
      expect(r.baseCircleDiameter2).toBeCloseTo(80 * Math.cos((20 * Math.PI) / 180), 3);
    });

    it('orders root < base < pitch < tip for a normal tooth count', () => {
      const r = gear({ mode: 'fromPitchDiameter', pitchDiameter: 51, numberOfTeeth: 17 });
      expect(r.rootDiameter1).toBeLessThan(r.baseCircleDiameter1);
      expect(r.baseCircleDiameter1).toBeLessThan(r.pitchDiameter1);
      expect(r.pitchDiameter1).toBeLessThan(r.tipDiameter1);
      expect(r.tipDiameter1).toBe(57);
      expect(r.rootDiameter1).toBe(43.5);
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
