import { describe, it, expect } from 'vitest';
import { boilerEfficiency } from './boilerEfficiency.js';

describe('boilerEfficiency', () => {
  describe('basic efficiency calculation', () => {
    it('should calculate boiler efficiency correctly', () => {
      const result = boilerEfficiency({
        fuelRate: 1000,            // 1000 kg/h natural gas
        fuelHeatValue: 42000,      // 42,000 kJ/kg
        steamOutput: 10000,        // 10,000 kg/h steam
        steamEnthalpy: 2760,       // kJ/kg (saturated steam ~10 bar)
        feedwaterEnthalpy: 420,    // kJ/kg (~100°C feedwater)
      });

      // heatInput = 1000 × 42000 / 3600 = 11666.67 kW
      expect(result.heatInput).toBeCloseTo(11666.67, 1);

      // heatOutput = 10000 × (2760 - 420) / 3600 = 6500 kW
      expect(result.heatOutput).toBeCloseTo(6500, 1);

      // efficiency = 6500 / 11666.67 × 100 = 55.71%
      expect(result.efficiency).toBeCloseTo(55.71, 1);
    });

    it('should calculate heat loss correctly', () => {
      const result = boilerEfficiency({
        fuelRate: 500,
        fuelHeatValue: 45000,
        steamOutput: 5000,
        steamEnthalpy: 2780,
        feedwaterEnthalpy: 400,
      });

      expect(result.heatLoss).toBeCloseTo(result.heatInput - result.heatOutput, 2);
      expect(result.heatLoss).toBeGreaterThan(0);
    });
  });

  describe('annual metrics', () => {
    it('should calculate annual fuel cost when both params provided', () => {
      const result = boilerEfficiency({
        fuelRate: 1000,
        fuelHeatValue: 42000,
        steamOutput: 10000,
        steamEnthalpy: 2760,
        feedwaterEnthalpy: 420,
        operatingHours: 8000,
        fuelCost: 0.5,
      });

      // annualFuelCost = 1000 × 8000 × 0.5 = $4,000,000
      expect(result.annualFuelCost).toBe(4000000);
    });

    it('should calculate annual heat loss when hours provided', () => {
      const result = boilerEfficiency({
        fuelRate: 1000,
        fuelHeatValue: 42000,
        steamOutput: 10000,
        steamEnthalpy: 2760,
        feedwaterEnthalpy: 420,
        operatingHours: 8000,
      });

      // annualHeatLoss = heatLoss × 8000
      expect(result.annualHeatLoss).toBeCloseTo(result.heatLoss * 8000, 0);
    });

    it('should return null annual metrics when optional params missing', () => {
      const result = boilerEfficiency({
        fuelRate: 1000,
        fuelHeatValue: 42000,
        steamOutput: 10000,
        steamEnthalpy: 2760,
        feedwaterEnthalpy: 420,
      });

      expect(result.annualFuelCost).toBeNull();
      expect(result.annualHeatLoss).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero fuel rate', () => {
      const result = boilerEfficiency({
        fuelRate: 0,
        fuelHeatValue: 42000,
        steamOutput: 10000,
        steamEnthalpy: 2760,
        feedwaterEnthalpy: 420,
      });

      expect(result.efficiency).toBe(0);
      expect(result.heatInput).toBe(0);
    });

    it('should return zeros for zero heat value', () => {
      const result = boilerEfficiency({
        fuelRate: 1000,
        fuelHeatValue: 0,
        steamOutput: 10000,
        steamEnthalpy: 2760,
        feedwaterEnthalpy: 420,
      });

      expect(result.efficiency).toBe(0);
    });

    it('should handle high-efficiency boiler', () => {
      // Condensing boiler scenario
      const result = boilerEfficiency({
        fuelRate: 100,
        fuelHeatValue: 36000,
        steamOutput: 800,
        steamEnthalpy: 2760,
        feedwaterEnthalpy: 420,
      });

      expect(result.efficiency).toBeGreaterThan(0);
      expect(result.efficiency).toBeLessThanOrEqual(100);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate typical industrial fire-tube boiler', () => {
      const result = boilerEfficiency({
        fuelRate: 2000,
        fuelHeatValue: 44000,       // HFO
        steamOutput: 20000,
        steamEnthalpy: 2790,        // 15 bar saturated
        feedwaterEnthalpy: 500,     // 120°C feedwater
        operatingHours: 7500,
        fuelCost: 0.35,
      });

      expect(result.efficiency).toBeGreaterThan(40);
      expect(result.efficiency).toBeLessThan(95);
      expect(result.annualFuelCost).toBeGreaterThan(0);
    });
  });
});
