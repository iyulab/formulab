import { describe, it, expect } from 'vitest';
import { transformerLoss } from './transformerLoss.js';

describe('transformerLoss', () => {
  describe('basic loss calculation', () => {
    it('should calculate total loss at given load', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,   // 1000 kVA
        coreLoss: 1800,        // W
        copperLoss: 10500,     // W at full load
        loadFraction: 0.75,
      });

      // copperLossAtLoad = 10500 × 0.75² = 5906.25 W
      expect(result.copperLossAtLoad).toBeCloseTo(5906.25, 1);

      // totalLoss = 1800 + 5906.25 = 7706.25 W
      expect(result.totalLoss).toBeCloseTo(7706.25, 1);

      // coreLoss stays constant
      expect(result.coreLossAtLoad).toBe(1800);
    });

    it('should calculate output power correctly', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,
        coreLoss: 1800,
        copperLoss: 10500,
        loadFraction: 0.75,
        powerFactor: 0.9,
      });

      // outputPower = 1000 × 0.75 × 0.9 × 1000 = 675,000 W
      expect(result.outputPower).toBe(675000);
    });

    it('should use default power factor of 0.85', () => {
      const result = transformerLoss({
        ratedCapacity: 500,
        coreLoss: 900,
        copperLoss: 5200,
        loadFraction: 1.0,
      });

      // outputPower = 500 × 1.0 × 0.85 × 1000 = 425,000 W
      expect(result.outputPower).toBe(425000);
    });
  });

  describe('efficiency calculation', () => {
    it('should calculate efficiency correctly', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,
        coreLoss: 1800,
        copperLoss: 10500,
        loadFraction: 0.75,
        powerFactor: 0.85,
      });

      // output = 1000 × 0.75 × 0.85 × 1000 = 637,500 W
      // totalLoss = 1800 + 10500 × 0.5625 = 7706.25 W
      // efficiency = 637500 / (637500 + 7706.25) × 100 = 98.81%
      expect(result.efficiency).toBeCloseTo(98.81, 1);
    });

    it('should calculate optimal load fraction', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,
        coreLoss: 1800,
        copperLoss: 10500,
        loadFraction: 0.5,
      });

      // optimalLoad = √(1800 / 10500) = 0.4140
      expect(result.optimalLoadFraction).toBeCloseTo(0.414, 2);
    });
  });

  describe('annual metrics', () => {
    it('should calculate annual loss energy and cost', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,
        coreLoss: 1800,
        copperLoss: 10500,
        loadFraction: 0.75,
        operatingHours: 8760,
        energyCost: 0.10,
      });

      // annualLossEnergy = totalLoss × 8760 / 1000 kWh
      const expectedLoss = result.totalLoss * 8760 / 1000;
      expect(result.annualLossEnergy).toBeCloseTo(expectedLoss, 0);

      // annualLossCost = annualLossEnergy × 0.10
      expect(result.annualLossCost).toBeCloseTo(expectedLoss * 0.10, 0);
    });

    it('should return null when operating hours not provided', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,
        coreLoss: 1800,
        copperLoss: 10500,
        loadFraction: 0.75,
      });

      expect(result.annualLossEnergy).toBeNull();
      expect(result.annualLossCost).toBeNull();
    });

    it('should return null cost when only hours provided', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,
        coreLoss: 1800,
        copperLoss: 10500,
        loadFraction: 0.75,
        operatingHours: 8760,
      });

      expect(result.annualLossEnergy).not.toBeNull();
      expect(result.annualLossCost).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero rated capacity', () => {
      const result = transformerLoss({
        ratedCapacity: 0,
        coreLoss: 1800,
        copperLoss: 10500,
        loadFraction: 0.75,
      });

      expect(result.outputPower).toBe(0);
      expect(result.efficiency).toBe(0);
    });

    it('should handle zero load (no-load condition)', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,
        coreLoss: 1800,
        copperLoss: 10500,
        loadFraction: 0,
      });

      // Only core loss at no load
      expect(result.copperLossAtLoad).toBe(0);
      expect(result.totalLoss).toBe(1800);
      expect(result.outputPower).toBe(0);
    });

    it('should handle zero copper loss', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,
        coreLoss: 1800,
        copperLoss: 0,
        loadFraction: 0.75,
      });

      expect(result.optimalLoadFraction).toBe(0);
    });

    it('should handle full load', () => {
      const result = transformerLoss({
        ratedCapacity: 1000,
        coreLoss: 1800,
        copperLoss: 10500,
        loadFraction: 1.0,
      });

      expect(result.copperLossAtLoad).toBe(10500);
      expect(result.totalLoss).toBe(12300);
    });
  });
});
