import { describe, it, expect } from 'vitest';
import { thermalComfort } from './thermalComfort.js';

describe('thermalComfort', () => {
  describe('neutral conditions', () => {
    it('should return PMV ≈ 0 for standard neutral conditions', () => {
      // ISO 7730 typical neutral: 22°C, 0.1 m/s, 50% RH, 1 met, 1 clo
      const result = thermalComfort({
        airTemp: 22,
        radiantTemp: 22,
        airVelocity: 0.1,
        relativeHumidity: 50,
        metabolicRate: 1.0,
        clothingInsulation: 1.0,
      });

      expect(result.pmv).toBeCloseTo(0, 0);
      expect(result.ppd).toBeLessThan(10);
      expect(result.sensation).toBe('neutral');
    });
  });

  describe('warm conditions', () => {
    it('should return positive PMV for warm environment', () => {
      const result = thermalComfort({
        airTemp: 30,
        radiantTemp: 30,
        airVelocity: 0.1,
        relativeHumidity: 60,
        metabolicRate: 1.2,
        clothingInsulation: 0.5,
      });

      expect(result.pmv).toBeGreaterThan(0);
      expect(result.sensation).not.toBe('cold');
      expect(result.sensation).not.toBe('cool');
    });

    it('should classify hot conditions', () => {
      const result = thermalComfort({
        airTemp: 35,
        radiantTemp: 35,
        airVelocity: 0.1,
        relativeHumidity: 70,
        metabolicRate: 2.0,
        clothingInsulation: 1.0,
      });

      expect(result.pmv).toBeGreaterThan(2.5);
      expect(result.sensation).toBe('hot');
    });
  });

  describe('cold conditions', () => {
    it('should return negative PMV for cold environment', () => {
      const result = thermalComfort({
        airTemp: 15,
        radiantTemp: 15,
        airVelocity: 0.3,
        relativeHumidity: 40,
        metabolicRate: 1.0,
        clothingInsulation: 0.5,
      });

      expect(result.pmv).toBeLessThan(0);
      expect(result.ppd).toBeGreaterThan(5);
    });
  });

  describe('PPD calculation', () => {
    it('should have minimum PPD of 5% when PMV = 0', () => {
      // PPD = 100 - 95*exp(0) = 5%
      const result = thermalComfort({
        airTemp: 22,
        radiantTemp: 22,
        airVelocity: 0.1,
        relativeHumidity: 50,
        metabolicRate: 1.0,
        clothingInsulation: 1.0,
      });

      expect(result.ppd).toBeGreaterThanOrEqual(5);
    });

    it('should increase PPD as PMV deviates from 0', () => {
      const neutral = thermalComfort({
        airTemp: 22, radiantTemp: 22, airVelocity: 0.1,
        relativeHumidity: 50, metabolicRate: 1.0, clothingInsulation: 1.0,
      });
      const warm = thermalComfort({
        airTemp: 28, radiantTemp: 28, airVelocity: 0.1,
        relativeHumidity: 50, metabolicRate: 1.0, clothingInsulation: 1.0,
      });

      expect(warm.ppd).toBeGreaterThan(neutral.ppd);
    });
  });

  describe('ISO 7730 categories', () => {
    it('should classify Category A for |PMV| < 0.2', () => {
      const result = thermalComfort({
        airTemp: 22, radiantTemp: 22, airVelocity: 0.1,
        relativeHumidity: 50, metabolicRate: 1.0, clothingInsulation: 1.0,
      });

      if (Math.abs(result.pmv) < 0.2) {
        expect(result.category).toBe('A');
      }
    });

    it('should classify outside for |PMV| >= 0.7', () => {
      const result = thermalComfort({
        airTemp: 30, radiantTemp: 30, airVelocity: 0.1,
        relativeHumidity: 70, metabolicRate: 2.0, clothingInsulation: 1.0,
      });

      expect(Math.abs(result.pmv)).toBeGreaterThanOrEqual(0.7);
      expect(result.category).toBe('outside');
    });
  });

  describe('air velocity effect', () => {
    it('should decrease PMV with higher air velocity in warm conditions', () => {
      const base = { airTemp: 28, radiantTemp: 28, relativeHumidity: 50, metabolicRate: 1.2, clothingInsulation: 0.5 };
      const slow = thermalComfort({ ...base, airVelocity: 0.1 });
      const fast = thermalComfort({ ...base, airVelocity: 1.0 });

      expect(fast.pmv).toBeLessThan(slow.pmv);
    });
  });
});
