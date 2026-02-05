import { describe, it, expect } from 'vitest';
import { vfdSavings } from './vfdSavings.js';

describe('vfdSavings', () => {
  describe('speed ratio calculation', () => {
    it('should calculate speed ratio correctly', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // Speed ratio = 1200 / 1500 = 0.8
      expect(result.speedRatio).toBe(0.8);
    });
  });

  describe('power ratio calculation (affinity law)', () => {
    it('should calculate power ratio using cube law', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // Power ratio = 0.8³ = 0.512
      expect(result.powerRatio).toBeCloseTo(0.512, 3);
    });

    it('should show dramatic reduction at 50% speed', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 750,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // Power ratio = 0.5³ = 0.125 (87.5% reduction!)
      expect(result.powerRatio).toBe(0.125);
    });
  });

  describe('power reduction calculation', () => {
    it('should calculate power reduction correctly', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // Original = 50 kW, New = 50 × 0.512 / 0.97 = 26.39 kW
      // Reduction = 50 - 26.39 = 23.61 kW
      expect(result.powerReduction).toBeCloseTo(23.61, 0);
    });

    it('should calculate power reduction percent correctly', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // Reduction % = 23.61 / 50 × 100 = 47.2%
      expect(result.powerReductionPercent).toBeCloseTo(47.2, 0);
    });
  });

  describe('cost calculation', () => {
    it('should calculate original annual cost correctly', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // Original = 50 × 6000 × 0.10 = $30,000
      expect(result.originalAnnualCost).toBe(30000);
    });

    it('should calculate new annual cost correctly', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // New power = 26.39 kW
      // New cost = 26.39 × 6000 × 0.10 = $15,835
      expect(result.newAnnualCost).toBeCloseTo(15835, -1);
    });

    it('should calculate annual savings correctly', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // Savings = 30,000 - 15,835 = $14,165
      expect(result.annualSavings).toBeCloseTo(14165, -1);
    });
  });

  describe('payback calculation', () => {
    it('should calculate payback years correctly', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // Payback = 5000 / 14165 = 0.35 years
      expect(result.paybackYears).toBeCloseTo(0.35, 1);
    });

    it('should return zero when no savings', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1500,  // Same speed = no savings
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      expect(result.paybackYears).toBe(0);
    });
  });

  describe('CO2 reduction calculation', () => {
    it('should calculate CO2 reduction correctly', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // kWh savings = 50×6000 - 26.39×6000 = 141,657 kWh
      // CO2 = 141,657 × 0.5 = 70,828 kg
      expect(result.co2ReductionKg).toBeCloseTo(70828, -2);
    });
  });

  describe('load factor impact', () => {
    it('should account for partial load', () => {
      const result = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 0.75,  // 75% load
        vfdCost: 5000,
        vfdEfficiency: 0.97,
      });

      // Original power = 50 × 0.75 = 37.5 kW
      expect(result.originalPowerKw).toBe(37.5);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate HVAC fan VFD', () => {
      const result = vfdSavings({
        motorKw: 30,
        fullSpeedRpm: 1800,
        newSpeedRpm: 1260,   // 70% speed
        runningHoursPerYear: 8760,  // 24/7
        electricityRate: 0.12,
        loadFactor: 0.80,
        vfdCost: 4000,
        vfdEfficiency: 0.96,
      });

      // 70% speed = 34.3% power (cube law)
      expect(result.powerRatio).toBeCloseTo(0.343, 2);
      expect(result.paybackYears).toBeLessThan(1);
    });

    it('should calculate cooling tower pump VFD', () => {
      const result = vfdSavings({
        motorKw: 75,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1125,   // 75% speed
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 0.90,
        vfdCost: 8000,
        vfdEfficiency: 0.97,
      });

      expect(result.annualSavings).toBeGreaterThan(10000);
    });

    it('should calculate chilled water pump VFD', () => {
      const result = vfdSavings({
        motorKw: 22,
        fullSpeedRpm: 1450,
        newSpeedRpm: 1015,   // 70% speed
        runningHoursPerYear: 4000,
        electricityRate: 0.15,
        loadFactor: 0.85,
        vfdCost: 3500,
        vfdEfficiency: 0.95,
      });

      expect(result.powerReductionPercent).toBeGreaterThan(60);
    });
  });

  describe('VFD efficiency impact', () => {
    it('should show lower efficiency increases power consumption', () => {
      const highEff = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.98,
      });

      const lowEff = vfdSavings({
        motorKw: 50,
        fullSpeedRpm: 1500,
        newSpeedRpm: 1200,
        runningHoursPerYear: 6000,
        electricityRate: 0.10,
        loadFactor: 1.0,
        vfdCost: 5000,
        vfdEfficiency: 0.92,
      });

      expect(lowEff.newPowerKw).toBeGreaterThan(highEff.newPowerKw);
      expect(lowEff.annualSavings).toBeLessThan(highEff.annualSavings);
    });
  });
});
