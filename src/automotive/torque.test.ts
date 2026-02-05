import { describe, it, expect } from 'vitest';
import { torque } from './torque.js';

describe('torque', () => {
  describe('conversion from Nm', () => {
    it('should return same value for Nm', () => {
      const result = torque({
        fromUnit: 'Nm',
        value: 100,
      });

      expect(result.Nm).toBe(100);
    });

    it('should convert to kgf·m correctly', () => {
      const result = torque({
        fromUnit: 'Nm',
        value: 100,
      });

      // 100 Nm × 0.10197 = 10.197 kgf·m
      expect(result.kgfm).toBeCloseTo(10.197, 2);
    });

    it('should convert to ft·lbf correctly', () => {
      const result = torque({
        fromUnit: 'Nm',
        value: 100,
      });

      // 100 Nm × 0.73756 = 73.756 ft·lbf
      expect(result.ftlbf).toBeCloseTo(73.756, 2);
    });
  });

  describe('conversion from kgf·m', () => {
    it('should convert to Nm correctly', () => {
      const result = torque({
        fromUnit: 'kgfm',
        value: 10,
      });

      // 10 kgf·m / 0.10197 = 98.07 Nm
      expect(result.Nm).toBeCloseTo(98.07, 0);
    });

    it('should return correct kgf·m', () => {
      const result = torque({
        fromUnit: 'kgfm',
        value: 10,
      });

      expect(result.kgfm).toBeCloseTo(10, 0);
    });

    it('should convert to ft·lbf correctly', () => {
      const result = torque({
        fromUnit: 'kgfm',
        value: 10,
      });

      // 98.07 Nm × 0.73756 = 72.32 ft·lbf
      expect(result.ftlbf).toBeCloseTo(72.32, 0);
    });
  });

  describe('conversion from ft·lbf', () => {
    it('should convert to Nm correctly', () => {
      const result = torque({
        fromUnit: 'ftlbf',
        value: 100,
      });

      // 100 ft·lbf / 0.73756 = 135.58 Nm
      expect(result.Nm).toBeCloseTo(135.58, 0);
    });

    it('should convert to kgf·m correctly', () => {
      const result = torque({
        fromUnit: 'ftlbf',
        value: 100,
      });

      // 135.58 Nm × 0.10197 = 13.83 kgf·m
      expect(result.kgfm).toBeCloseTo(13.83, 1);
    });

    it('should return correct ft·lbf', () => {
      const result = torque({
        fromUnit: 'ftlbf',
        value: 100,
      });

      expect(result.ftlbf).toBeCloseTo(100, 0);
    });
  });

  describe('edge cases', () => {
    it('should handle zero value', () => {
      const result = torque({
        fromUnit: 'Nm',
        value: 0,
      });

      expect(result.Nm).toBe(0);
      expect(result.kgfm).toBe(0);
      expect(result.ftlbf).toBe(0);
    });

    it('should handle small values', () => {
      const result = torque({
        fromUnit: 'Nm',
        value: 1,
      });

      expect(result.Nm).toBe(1);
      expect(result.kgfm).toBeCloseTo(0.102, 2);
      expect(result.ftlbf).toBeCloseTo(0.738, 2);
    });

    it('should handle large values', () => {
      const result = torque({
        fromUnit: 'Nm',
        value: 1000,
      });

      expect(result.Nm).toBe(1000);
      expect(result.kgfm).toBeCloseTo(101.97, 1);
      expect(result.ftlbf).toBeCloseTo(737.56, 1);
    });
  });

  describe('real-world scenarios', () => {
    it('should convert wheel lug nut torque', () => {
      // Honda Civic: 108 Nm (80 ft-lbs)
      const result = torque({
        fromUnit: 'Nm',
        value: 108,
      });

      expect(result.ftlbf).toBeCloseTo(79.66, 0);
    });

    it('should convert engine torque spec', () => {
      // 2.0T engine: 350 Nm (258 ft-lbs)
      const result = torque({
        fromUnit: 'Nm',
        value: 350,
      });

      expect(result.ftlbf).toBeCloseTo(258.15, 0);
    });

    it('should convert spark plug torque', () => {
      // Typical spark plug: 20 Nm
      const result = torque({
        fromUnit: 'Nm',
        value: 20,
      });

      expect(result.ftlbf).toBeCloseTo(14.75, 1);
    });

    it('should convert oil drain plug torque', () => {
      // Typical: 35 Nm (26 ft-lbs)
      const result = torque({
        fromUnit: 'ftlbf',
        value: 26,
      });

      expect(result.Nm).toBeCloseTo(35.26, 0);
    });

    it('should convert Japanese spec (kgf·m)', () => {
      // Some Japanese cars spec in kgf·m
      const result = torque({
        fromUnit: 'kgfm',
        value: 4.5,
      });

      expect(result.Nm).toBeCloseTo(44.13, 0);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain value through Nm -> ft·lbf -> Nm', () => {
      const original = 100;
      const toFtLbf = torque({ fromUnit: 'Nm', value: original });
      const backToNm = torque({ fromUnit: 'ftlbf', value: toFtLbf.ftlbf });

      expect(backToNm.Nm).toBeCloseTo(original, 0);
    });

    it('should maintain value through kgf·m -> Nm -> kgf·m', () => {
      const original = 10;
      const toNm = torque({ fromUnit: 'kgfm', value: original });
      const backToKgfm = torque({ fromUnit: 'Nm', value: toNm.Nm });

      expect(backToKgfm.kgfm).toBeCloseTo(original, 0);
    });
  });
});
