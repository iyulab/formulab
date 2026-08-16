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

    it('should match the Hellmann power law golden value', () => {
      // V_hub = 6 × (80/10)^0.143 = 6 × 8^0.143 = 8.0778 (independently computed),
      // rounded to 2 decimals by the implementation → 8.08
      const result = windOutput({
        ratedPower: 2000, hubHeight: 80, averageWindSpeed: 6,
      });

      expect(result.adjustedWindSpeed).toBeCloseTo(8.08, 2);
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

    it('should match the Betz limit closed-form golden value (Cp_max = 16/27)', () => {
      // hub = referenceHeight → no Hellmann adjustment, adjustedWindSpeed = 8 exactly.
      // sweptArea = π × 40² = 5026.5482 m²
      // P_betz = (16/27) × 0.5 × 1.225 kg/m³ × A × v³ / 1000 = 934.1188 kW (independently computed)
      const result = windOutput({
        ratedPower: 2000, hubHeight: 10, averageWindSpeed: 8, referenceHeight: 10,
        rotorDiameter: 80,
      });

      expect(result.adjustedWindSpeed).toBeCloseTo(8, 4);
      expect(result.betzLimit).toBeCloseTo(934.1188, 2);
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
