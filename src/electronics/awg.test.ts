import { describe, it, expect } from 'vitest';
import { awgProperties } from './awg.js';

describe('awgProperties', () => {
  describe('diameter calculation', () => {
    it('should calculate AWG 22 diameter correctly', () => {
      const result = awgProperties({
        awg: 22,
        material: 'copper',
        tempC: 20,
      });

      // AWG 22 is approximately 0.644 mm
      expect(result).not.toBeNull();
      expect(result.diameterMm).toBeCloseTo(0.644, 2);
    });

    it('should calculate AWG 10 diameter correctly', () => {
      const result = awgProperties({
        awg: 10,
        material: 'copper',
        tempC: 20,
      });

      // AWG 10 is approximately 2.588 mm
      expect(result.diameterMm).toBeCloseTo(2.588, 2);
    });

    it('should calculate AWG 0 diameter correctly', () => {
      const result = awgProperties({
        awg: 0,
        material: 'copper',
        tempC: 20,
      });

      // AWG 0 is approximately 8.252 mm
      expect(result.diameterMm).toBeCloseTo(8.252, 1);
    });
  });

  describe('cross-sectional area', () => {
    it('should calculate area in mm² correctly', () => {
      const result = awgProperties({
        awg: 22,
        material: 'copper',
        tempC: 20,
      });

      // Area = π × (0.644/2)² ≈ 0.326 mm²
      expect(result.areaMm2).toBeCloseTo(0.326, 2);
    });

    it('should calculate circular mils correctly', () => {
      const result = awgProperties({
        awg: 22,
        material: 'copper',
        tempC: 20,
      });

      // AWG 22 ≈ 642 circular mils
      expect(result.areaCircularMils).toBeCloseTo(642, -1);
    });
  });

  describe('resistance calculation', () => {
    it('should calculate resistance per meter for copper at 20°C', () => {
      const result = awgProperties({
        awg: 22,
        material: 'copper',
        tempC: 20,
      });

      // ~52.9 mΩ/m for AWG 22 copper
      expect(result.resistancePerM).toBeCloseTo(0.0529, 3);
    });

    it('should calculate resistance per foot correctly', () => {
      const result = awgProperties({
        awg: 22,
        material: 'copper',
        tempC: 20,
      });

      // Resistance per ft = resistance per m × 0.3048
      expect(result.resistancePerFt).toBeCloseTo(result.resistancePerM * 0.3048, 5);
    });

    it('should increase resistance at higher temperature', () => {
      const result20 = awgProperties({
        awg: 22,
        material: 'copper',
        tempC: 20,
      });

      const result75 = awgProperties({
        awg: 22,
        material: 'copper',
        tempC: 75,
      });

      expect(result75!.resistancePerM).toBeGreaterThan(result20!.resistancePerM);
    });

    it('should decrease resistance at lower temperature', () => {
      const result20 = awgProperties({
        awg: 22,
        material: 'copper',
        tempC: 20,
      });

      const result0 = awgProperties({
        awg: 22,
        material: 'copper',
        tempC: 0,
      });

      expect(result0!.resistancePerM).toBeLessThan(result20!.resistancePerM);
    });
  });

  describe('material comparison', () => {
    it('should show aluminum has higher resistance than copper', () => {
      const copper = awgProperties({
        awg: 10,
        material: 'copper',
        tempC: 20,
      });

      const aluminum = awgProperties({
        awg: 10,
        material: 'aluminum',
        tempC: 20,
      });

      expect(aluminum!.resistancePerM).toBeGreaterThan(copper!.resistancePerM);
    });

    it('should show aluminum has lower current capacity than copper', () => {
      const copper = awgProperties({
        awg: 10,
        material: 'copper',
        tempC: 20,
      });

      const aluminum = awgProperties({
        awg: 10,
        material: 'aluminum',
        tempC: 20,
      });

      expect(aluminum!.currentCapacity).toBeLessThan(copper!.currentCapacity);
    });
  });

  describe('current capacity', () => {
    it('should calculate current capacity for copper', () => {
      const result = awgProperties({
        awg: 14,
        material: 'copper',
        tempC: 20,
      });

      // AWG 14 copper: ~2.08 mm², capacity ≈ 11.4 A
      expect(result.currentCapacity).toBeCloseTo(11.4, 0);
    });
  });

  describe('input validation', () => {
    it('should throw RangeError for AWG less than 0', () => {
      expect(() => awgProperties({
        awg: -1,
        material: 'copper',
        tempC: 20,
      })).toThrow(RangeError);
    });

    it('should throw RangeError for AWG greater than 40', () => {
      expect(() => awgProperties({
        awg: 41,
        material: 'copper',
        tempC: 20,
      })).toThrow(RangeError);
    });

    it('should accept AWG 40 (boundary)', () => {
      const result = awgProperties({
        awg: 40,
        material: 'copper',
        tempC: 20,
      });

      expect(result.diameterMm).toBeGreaterThan(0);
    });

    it('should accept AWG 0 (boundary)', () => {
      const result = awgProperties({
        awg: 0,
        material: 'copper',
        tempC: 20,
      });

      expect(result.diameterMm).toBeGreaterThan(0);
    });
  });

  describe('real-world wire sizes', () => {
    it('should match typical household wire (AWG 14)', () => {
      const result = awgProperties({
        awg: 14,
        material: 'copper',
        tempC: 25,
      });

      // AWG 14 is commonly used for 15A circuits
      expect(result.diameterMm).toBeCloseTo(1.628, 2);
    });

    it('should match typical appliance wire (AWG 12)', () => {
      const result = awgProperties({
        awg: 12,
        material: 'copper',
        tempC: 25,
      });

      // AWG 12 is commonly used for 20A circuits
      expect(result.diameterMm).toBeCloseTo(2.053, 2);
    });
  });
});
