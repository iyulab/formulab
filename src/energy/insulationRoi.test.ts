import { describe, it, expect } from 'vitest';
import { insulationRoi } from './insulationRoi.js';

describe('insulationRoi', () => {
  describe('heat loss calculation', () => {
    it('should calculate bare heat loss correctly', () => {
      const result = insulationRoi({
        surfaceArea: 50,           // 50 m²
        tempDifference: 150,       // 150°C
        insulationK: 0.04,         // mineral wool
        insulationThickness: 50,   // 50 mm
        operatingHours: 8000,
        energyCost: 0.05,
      });

      // bareHeatLoss = 10 × 50 × 150 = 75,000 W
      expect(result.bareHeatLoss).toBe(75000);
    });

    it('should calculate insulated heat loss correctly', () => {
      const result = insulationRoi({
        surfaceArea: 50,
        tempDifference: 150,
        insulationK: 0.04,
        insulationThickness: 50,   // 50mm = 0.05m
        surfaceCoefficient: 10,
        operatingHours: 8000,
        energyCost: 0.05,
      });

      // thermalResistance = 1/10 + 0.05/0.04 = 0.1 + 1.25 = 1.35
      // insulatedHeatLoss = 50 × 150 / 1.35 = 5555.56 W
      expect(result.insulatedHeatLoss).toBeCloseTo(5555.56, 0);
    });

    it('should calculate heat loss reduction percentage', () => {
      const result = insulationRoi({
        surfaceArea: 50,
        tempDifference: 150,
        insulationK: 0.04,
        insulationThickness: 50,
        operatingHours: 8000,
        energyCost: 0.05,
      });

      // heatSaved = 75000 - 5555.56 = 69444.44
      // reduction = 69444.44 / 75000 × 100 = 92.59%
      expect(result.heatLossReduction).toBeCloseTo(92.59, 0);
      expect(result.heatSaved).toBeCloseTo(69444.44, 0);
    });
  });

  describe('annual savings', () => {
    it('should calculate annual energy saved with boiler efficiency', () => {
      const result = insulationRoi({
        surfaceArea: 50,
        tempDifference: 150,
        insulationK: 0.04,
        insulationThickness: 50,
        operatingHours: 8000,
        energyCost: 0.05,
        boilerEfficiency: 0.8,
      });

      // annualEnergySaved = heatSaved × 8000 / 1000 / 0.8
      const expectedEnergy = result.heatSaved * 8000 / 1000 / 0.8;
      expect(result.annualEnergySaved).toBeCloseTo(expectedEnergy, 0);
    });

    it('should calculate annual cost saved', () => {
      const result = insulationRoi({
        surfaceArea: 50,
        tempDifference: 150,
        insulationK: 0.04,
        insulationThickness: 50,
        operatingHours: 8000,
        energyCost: 0.05,
        boilerEfficiency: 0.8,
      });

      expect(result.annualCostSaved).toBeCloseTo(result.annualEnergySaved * 0.05, 0);
    });

    it('should use default boiler efficiency of 0.8', () => {
      const result = insulationRoi({
        surfaceArea: 10,
        tempDifference: 100,
        insulationK: 0.04,
        insulationThickness: 25,
        operatingHours: 6000,
        energyCost: 0.08,
      });

      // Should use 0.8 boiler efficiency
      const expectedEnergy = result.heatSaved * 6000 / 1000 / 0.8;
      expect(result.annualEnergySaved).toBeCloseTo(expectedEnergy, 0);
    });
  });

  describe('payback period', () => {
    it('should calculate payback period correctly', () => {
      const result = insulationRoi({
        surfaceArea: 50,
        tempDifference: 150,
        insulationK: 0.04,
        insulationThickness: 50,
        operatingHours: 8000,
        energyCost: 0.05,
        installationCost: 10000,
      });

      expect(result.paybackPeriod).toBeCloseTo(10000 / result.annualCostSaved, 2);
      expect(result.paybackPeriod).toBeGreaterThan(0);
    });

    it('should return null when no installation cost', () => {
      const result = insulationRoi({
        surfaceArea: 50,
        tempDifference: 150,
        insulationK: 0.04,
        insulationThickness: 50,
        operatingHours: 8000,
        energyCost: 0.05,
      });

      expect(result.paybackPeriod).toBeNull();
    });

    it('should return null when installation cost is zero', () => {
      const result = insulationRoi({
        surfaceArea: 50,
        tempDifference: 150,
        insulationK: 0.04,
        insulationThickness: 50,
        operatingHours: 8000,
        energyCost: 0.05,
        installationCost: 0,
      });

      expect(result.paybackPeriod).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero surface area', () => {
      const result = insulationRoi({
        surfaceArea: 0,
        tempDifference: 150,
        insulationK: 0.04,
        insulationThickness: 50,
        operatingHours: 8000,
        energyCost: 0.05,
      });

      expect(result.bareHeatLoss).toBe(0);
      expect(result.annualEnergySaved).toBe(0);
    });

    it('should return zeros for zero temp difference', () => {
      const result = insulationRoi({
        surfaceArea: 50,
        tempDifference: 0,
        insulationK: 0.04,
        insulationThickness: 50,
        operatingHours: 8000,
        energyCost: 0.05,
      });

      expect(result.bareHeatLoss).toBe(0);
    });

    it('should handle custom surface coefficient', () => {
      const result = insulationRoi({
        surfaceArea: 10,
        tempDifference: 100,
        insulationK: 0.04,
        insulationThickness: 50,
        surfaceCoefficient: 15,
        operatingHours: 6000,
        energyCost: 0.08,
      });

      // bareHeatLoss = 15 × 10 × 100 = 15000 W
      expect(result.bareHeatLoss).toBe(15000);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate steam pipe insulation ROI', () => {
      const result = insulationRoi({
        surfaceArea: 30,
        tempDifference: 170,       // 180°C steam, 10°C ambient
        insulationK: 0.035,        // calcium silicate
        insulationThickness: 75,
        operatingHours: 8400,
        energyCost: 0.06,
        boilerEfficiency: 0.85,
        installationCost: 15000,
      });

      expect(result.heatLossReduction).toBeGreaterThan(90);
      expect(result.paybackPeriod).toBeGreaterThan(0);
      expect(result.paybackPeriod).toBeLessThan(5);
    });
  });
});
