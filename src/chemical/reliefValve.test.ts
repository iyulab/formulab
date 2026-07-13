import { describe, it, expect } from 'vitest';
import { reliefValve } from './reliefValve.js';

describe('reliefValve', () => {
  describe('gas sizing', () => {
    it('should calculate required area for gas relief', () => {
      const result = reliefValve({
        requiredCapacity: 5000, // kg/h
        setPressure: 1000,      // kPa gauge
        backPressure: 101,      // kPa gauge
        temperature: 100,       // °C
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(result.requiredArea).toBeGreaterThan(0);
      expect(result.selectedOrifice).toBeTruthy();
      expect(result.orificeArea).toBeGreaterThanOrEqual(result.requiredArea);
      expect(result.percentUtilized).toBeLessThanOrEqual(100);
    });

    it('should select correct orifice letter', () => {
      const result = reliefValve({
        requiredCapacity: 100,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(['D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'T'])
        .toContain(result.selectedOrifice);
    });
  });

  describe('liquid sizing', () => {
    it('should calculate required area for liquid relief', () => {
      const result = reliefValve({
        requiredCapacity: 10000,
        setPressure: 700,
        backPressure: 101,
        temperature: 20,
        fluidType: 'liquid',
        specificGravity: 1.0,
      });

      expect(result.requiredArea).toBeGreaterThan(0);
      expect(result.orificeArea).toBeGreaterThanOrEqual(result.requiredArea);
    });
  });

  describe('orifice selection', () => {
    it('should select larger orifice for higher capacity', () => {
      const small = reliefValve({
        requiredCapacity: 100,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
        molecularWeight: 29,
      });
      const large = reliefValve({
        requiredCapacity: 50000,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(large.orificeArea).toBeGreaterThanOrEqual(small.orificeArea);
    });
  });

  describe('relieving pressure', () => {
    it('should calculate relieving pressure with overpressure', () => {
      const result = reliefValve({
        requiredCapacity: 1000,
        setPressure: 1000,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
        overpressure: 10,
      });

      // Relieving = set + atm + 10% overpressure
      // = 1000 + 101.325 + 100 = 1201.325
      expect(result.relievingPressure).toBeCloseTo(1201.33, 0);
    });
  });

  describe('capacity at orifice', () => {
    it('should be >= required capacity', () => {
      const result = reliefValve({
        requiredCapacity: 1000,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
      });

      expect(result.capacityAtOrifice).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('orifice exceeds max (ISSUE-20260713 silent clamp)', () => {
    // Regression pins from the issue's execution evidence: realistic large reliefs
    // exceed the largest API 526 orifice ('T', 16,774 mm²) and must be flagged.
    it('flags gas relief beyond T (50,000 kg/h @ 1,000 kPa(g), 100°C, M=29)', () => {
      const result = reliefValve({
        requiredCapacity: 50000,
        setPressure: 1000,
        backPressure: 0,
        temperature: 100,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(result.requiredArea).toBeCloseTo(43005.5, 0);
      expect(result.selectedOrifice).toBe('T');
      expect(result.orificeArea).toBe(16774);
      expect(result.orificeExceedsMax).toBe(true);
      expect(result.percentUtilized).toBeCloseTo(256.38, 1);
      expect(result.capacityAtOrifice).toBeCloseTo(19502.16, 0);
    });

    it('flags steam relief beyond T (30,000 kg/h @ 1,500 kPa(g))', () => {
      const result = reliefValve({
        requiredCapacity: 30000,
        setPressure: 1500,
        backPressure: 0,
        temperature: 200,
        fluidType: 'steam',
        molecularWeight: 18,
      });

      expect(result.requiredArea).toBeCloseTo(25960.5, 0);
      expect(result.selectedOrifice).toBe('T');
      expect(result.orificeExceedsMax).toBe(true);
      expect(result.percentUtilized).toBeGreaterThan(100);
    });

    it('does not flag when T still covers the required area (boundary)', () => {
      const result = reliefValve({
        requiredCapacity: 19000, // scales the 50,000 kg/h case to ~16,342 mm² < 16,774
        setPressure: 1000,
        backPressure: 0,
        temperature: 100,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(result.selectedOrifice).toBe('T');
      expect(result.requiredArea).toBeLessThanOrEqual(16774);
      expect(result.orificeExceedsMax).toBe(false);
      expect(result.percentUtilized).toBeLessThanOrEqual(100);
    });

    it('does not flag ordinary in-range selections', () => {
      const result = reliefValve({
        requiredCapacity: 5000,
        setPressure: 1000,
        backPressure: 101,
        temperature: 100,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(result.orificeExceedsMax).toBe(false);
    });

    it('does not flag the liquid zero-differential edge (requiredArea = 0)', () => {
      const result = reliefValve({
        requiredCapacity: 1000,
        setPressure: 100,
        backPressure: 500, // back pressure above relieving pressure → dp <= 0
        temperature: 20,
        fluidType: 'liquid',
      });

      expect(result.requiredArea).toBe(0);
      expect(result.orificeExceedsMax).toBe(false);
    });
  });

  describe('percent utilized', () => {
    it('should be <= 100%', () => {
      const result = reliefValve({
        requiredCapacity: 1000,
        setPressure: 500,
        backPressure: 0,
        temperature: 50,
        fluidType: 'gas',
      });

      expect(result.percentUtilized).toBeLessThanOrEqual(100);
      expect(result.percentUtilized).toBeGreaterThan(0);
    });
  });
});
