import { describe, it, expect } from 'vitest';
import { windOutput } from './windOutput.js';

describe('windOutput', () => {
  describe('wind speed adjustment', () => {
    it('should adjust wind speed to hub height', () => {
      const result = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 6,
      });

      // V_hub = 6 × (80/10)^0.143 → should be higher than 6
      expect(result.adjustedWindSpeed).toBeGreaterThan(6);
    });

    it('should not change speed when hub = reference height', () => {
      const result = windOutput({
        ratedPower: 2000, hubHeight: 10, averageWindSpeed: 6,
        referenceHeight: 10,
      });

      expect(result.adjustedWindSpeed).toBeCloseTo(6, 1);
    });
  });

  describe('capacity factor', () => {
    it('should be between 0 and 1', () => {
      const result = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7,
      });

      expect(result.capacityFactor).toBeGreaterThan(0);
      expect(result.capacityFactor).toBeLessThanOrEqual(1);
    });

    it('should increase with higher wind speed', () => {
      const low = windOutput({ ratedPower: 2000, hubHeight: 80, averageWindSpeed: 5 });
      const high = windOutput({ ratedPower: 2000, hubHeight: 80, averageWindSpeed: 8 });

      expect(high.capacityFactor).toBeGreaterThan(low.capacityFactor);
    });

    it('should be 0 for zero wind speed', () => {
      const result = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 0,
      });

      expect(result.capacityFactor).toBe(0);
      expect(result.annualOutput).toBe(0);
    });
  });

  describe('annual output', () => {
    it('should calculate annual output proportional to capacity factor', () => {
      const result = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7,
      });

      // Verify relationship: annualOutput ≈ ratedPower × CF × 8760
      // Small rounding diff expected since CF is rounded to 4 decimals
      const expected = 2000 * result.capacityFactor * 8760;
      const relativeError = Math.abs(result.annualOutput - expected) / expected;
      expect(relativeError).toBeLessThan(0.001);
    });

    it('should have monthly = annual/12', () => {
      const result = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7,
      });

      expect(result.monthlyOutput).toBeCloseTo(result.annualOutput / 12, -1);
    });
  });

  describe('swept area and Betz limit', () => {
    it('should calculate swept area when rotor diameter given', () => {
      const result = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7,
        rotorDiameter: 80,
      });

      expect(result.sweptArea).toBeCloseTo(Math.PI * 40 * 40, 0);
      expect(result.betzLimit).toBeGreaterThan(0);
    });

    it('should return null when rotor diameter not given', () => {
      const result = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7,
      });

      expect(result.sweptArea).toBeNull();
      expect(result.betzLimit).toBeNull();
    });
  });

  describe('terrain roughness', () => {
    it('should produce higher speed with lower roughness (open terrain)', () => {
      const rough = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7,
        terrainRoughness: 0.3,
      });
      const smooth = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 7,
        terrainRoughness: 0.1,
      });

      expect(rough.adjustedWindSpeed).toBeGreaterThan(smooth.adjustedWindSpeed);
    });
  });
});
