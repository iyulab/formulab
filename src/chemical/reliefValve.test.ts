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
