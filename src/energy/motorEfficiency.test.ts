import { describe, it, expect } from 'vitest';
import { motorEfficiency } from './motorEfficiency.js';

describe('motorEfficiency', () => {
  describe('annual cost calculation', () => {
    it('should calculate current annual cost correctly', () => {
      const result = motorEfficiency({
        motorPower: 50,           // 50 kW motor
        runningHours: 6000,       // 6000 hours/year
        currentEfficiency: 0.90,  // 90% efficiency
        newEfficiency: 0.95,      // 95% efficiency
        electricityRate: 0.10,    // $0.10/kWh
        loadFactor: 0.75,         // 75% load
      });

      // Energy = 50 × 6000 × 0.75 / 0.90 = 250,000 kWh
      // Cost = 250,000 × 0.10 = $25,000
      expect(result.currentAnnualCost).toBe(25000);
    });

    it('should calculate new annual cost correctly', () => {
      const result = motorEfficiency({
        motorPower: 50,
        runningHours: 6000,
        currentEfficiency: 0.90,
        newEfficiency: 0.95,
        electricityRate: 0.10,
        loadFactor: 0.75,
      });

      // Energy = 50 × 6000 × 0.75 / 0.95 = 236,842 kWh
      // Cost = 236,842 × 0.10 = $23,684.21
      expect(result.newAnnualCost).toBeCloseTo(23684.21, 0);
    });
  });

  describe('savings calculation', () => {
    it('should calculate annual savings correctly', () => {
      const result = motorEfficiency({
        motorPower: 50,
        runningHours: 6000,
        currentEfficiency: 0.90,
        newEfficiency: 0.95,
        electricityRate: 0.10,
        loadFactor: 0.75,
      });

      // Savings = 25,000 - 23,684.21 = $1,315.79
      expect(result.annualSavings).toBeCloseTo(1315.79, 0);
    });

    it('should calculate energy savings correctly', () => {
      const result = motorEfficiency({
        motorPower: 50,
        runningHours: 6000,
        currentEfficiency: 0.90,
        newEfficiency: 0.95,
        electricityRate: 0.10,
        loadFactor: 0.75,
      });

      // Energy savings = 250,000 - 236,842 = 13,158 kWh
      expect(result.energySavings).toBeCloseTo(13157.89, 0);
    });
  });

  describe('payback period calculation', () => {
    it('should calculate payback period correctly', () => {
      const result = motorEfficiency({
        motorPower: 50,
        runningHours: 6000,
        currentEfficiency: 0.90,
        newEfficiency: 0.95,
        electricityRate: 0.10,
        loadFactor: 0.75,
        upgradeCost: 5000,
      });

      // Payback = 5000 / 1315.79 = 3.8 years
      expect(result.paybackPeriod).toBeCloseTo(3.8, 0);
    });

    it('should return null when no upgrade cost', () => {
      const result = motorEfficiency({
        motorPower: 50,
        runningHours: 6000,
        currentEfficiency: 0.90,
        newEfficiency: 0.95,
        electricityRate: 0.10,
        loadFactor: 0.75,
      });

      expect(result.paybackPeriod).toBeNull();
    });

    it('should return null when upgrade cost is zero', () => {
      const result = motorEfficiency({
        motorPower: 50,
        runningHours: 6000,
        currentEfficiency: 0.90,
        newEfficiency: 0.95,
        electricityRate: 0.10,
        loadFactor: 0.75,
        upgradeCost: 0,
      });

      expect(result.paybackPeriod).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero current efficiency', () => {
      const result = motorEfficiency({
        motorPower: 50,
        runningHours: 6000,
        currentEfficiency: 0,
        newEfficiency: 0.95,
        electricityRate: 0.10,
        loadFactor: 0.75,
      });

      expect(result.currentAnnualCost).toBe(0);
      expect(result.annualSavings).toBe(0);
    });

    it('should return zeros for zero new efficiency', () => {
      const result = motorEfficiency({
        motorPower: 50,
        runningHours: 6000,
        currentEfficiency: 0.90,
        newEfficiency: 0,
        electricityRate: 0.10,
        loadFactor: 0.75,
      });

      expect(result.newAnnualCost).toBe(0);
    });

    it('should handle same efficiency (no improvement)', () => {
      const result = motorEfficiency({
        motorPower: 50,
        runningHours: 6000,
        currentEfficiency: 0.90,
        newEfficiency: 0.90,
        electricityRate: 0.10,
        loadFactor: 0.75,
        upgradeCost: 1000,
      });

      expect(result.annualSavings).toBe(0);
      expect(result.paybackPeriod).toBeNull();  // No savings = no payback
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate IE2 to IE4 motor upgrade', () => {
      // Typical 75 kW pump motor upgrade
      const result = motorEfficiency({
        motorPower: 75,
        runningHours: 8000,        // Continuous operation
        currentEfficiency: 0.91,   // IE2 efficiency
        newEfficiency: 0.96,       // IE4 efficiency
        electricityRate: 0.12,
        loadFactor: 0.80,
        upgradeCost: 8000,
      });

      expect(result.annualSavings).toBeGreaterThan(3000);
      expect(result.paybackPeriod).toBeLessThan(3);
    });

    it('should calculate HVAC fan motor upgrade', () => {
      const result = motorEfficiency({
        motorPower: 15,
        runningHours: 4000,
        currentEfficiency: 0.85,
        newEfficiency: 0.93,
        electricityRate: 0.15,
        loadFactor: 0.70,
        upgradeCost: 2500,
      });

      expect(result.annualSavings).toBeGreaterThan(0);
    });

    it('should calculate full load motor', () => {
      const result = motorEfficiency({
        motorPower: 30,
        runningHours: 6000,
        currentEfficiency: 0.88,
        newEfficiency: 0.94,
        electricityRate: 0.11,
        loadFactor: 1.0,   // Full load
        upgradeCost: 4000,
      });

      // Full load = maximum savings potential
      expect(result.energySavings).toBeGreaterThan(10000);
    });

    it('should calculate lightly loaded motor', () => {
      const result = motorEfficiency({
        motorPower: 30,
        runningHours: 6000,
        currentEfficiency: 0.88,
        newEfficiency: 0.94,
        electricityRate: 0.11,
        loadFactor: 0.3,   // Light load
        upgradeCost: 4000,
      });

      // Light load = less savings
      expect(result.paybackPeriod).toBeGreaterThan(5);
    });
  });
});
