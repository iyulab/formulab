import { describe, it, expect } from 'vitest';
import { powerCost } from './powerCost.js';

describe('powerCost', () => {
  describe('basic cost calculations', () => {
    it('should calculate energy cost correctly', () => {
      const result = powerCost({
        energyConsumption: 10000, // kWh
        energyRate: 0.12, // $/kWh
        demandPeak: 50,
        demandRate: 10,
        powerFactor: 0.95,
        pfPenaltyThreshold: 0.9,
        pfPenaltyRate: 0,
        fixedCharges: 0,
      });

      expect(result.energyCost).toBe(1200); // 10000 * 0.12
    });

    it('should calculate demand cost correctly', () => {
      const result = powerCost({
        energyConsumption: 10000,
        energyRate: 0.12,
        demandPeak: 50, // kW
        demandRate: 10, // $/kW
        powerFactor: 0.95,
        pfPenaltyThreshold: 0.9,
        pfPenaltyRate: 0,
        fixedCharges: 0,
      });

      expect(result.demandCost).toBe(500); // 50 * 10
    });

    it('should include fixed charges', () => {
      const result = powerCost({
        energyConsumption: 10000,
        energyRate: 0.12,
        demandPeak: 50,
        demandRate: 10,
        powerFactor: 0.95,
        pfPenaltyThreshold: 0.9,
        pfPenaltyRate: 0,
        fixedCharges: 100,
      });

      expect(result.fixedCharges).toBe(100);
      expect(result.totalCost).toBe(1800); // 1200 + 500 + 100
    });
  });

  describe('power factor penalty', () => {
    it('should apply no penalty when PF above threshold', () => {
      const result = powerCost({
        energyConsumption: 10000,
        energyRate: 0.10,
        demandPeak: 100,
        demandRate: 10,
        powerFactor: 0.95,
        pfPenaltyThreshold: 0.90,
        pfPenaltyRate: 0.01,
        fixedCharges: 0,
      });

      expect(result.pfPenalty).toBe(0);
    });

    it('should apply penalty when PF below threshold', () => {
      const result = powerCost({
        energyConsumption: 10000,
        energyRate: 0.10,
        demandPeak: 100,
        demandRate: 10,
        powerFactor: 0.85, // 5 steps below 0.90
        pfPenaltyThreshold: 0.90,
        pfPenaltyRate: 0.01, // 1% per 0.01 step
        fixedCharges: 0,
      });

      // Energy + Demand = 1000 + 1000 = 2000
      // Steps below = 5
      // Penalty = 5 * 0.01 * 2000 = 100
      expect(result.pfPenalty).toBe(100);
      expect(result.totalCost).toBe(2100);
    });

    it('should apply larger penalty for lower PF', () => {
      const result = powerCost({
        energyConsumption: 10000,
        energyRate: 0.10,
        demandPeak: 100,
        demandRate: 10,
        powerFactor: 0.80, // 10 steps below 0.90
        pfPenaltyThreshold: 0.90,
        pfPenaltyRate: 0.01,
        fixedCharges: 0,
      });

      // Steps below = 10
      // Penalty = 10 * 0.01 * 2000 = 200
      expect(result.pfPenalty).toBe(200);
    });

    it('should not apply penalty when rate is zero', () => {
      const result = powerCost({
        energyConsumption: 10000,
        energyRate: 0.10,
        demandPeak: 100,
        demandRate: 10,
        powerFactor: 0.80,
        pfPenaltyThreshold: 0.90,
        pfPenaltyRate: 0, // No penalty rate
        fixedCharges: 0,
      });

      expect(result.pfPenalty).toBe(0);
    });
  });

  describe('total cost calculation', () => {
    it('should sum all cost components', () => {
      const result = powerCost({
        energyConsumption: 5000,
        energyRate: 0.15,
        demandPeak: 30,
        demandRate: 12,
        powerFactor: 0.88,
        pfPenaltyThreshold: 0.90,
        pfPenaltyRate: 0.005,
        fixedCharges: 50,
      });

      expect(result.energyCost).toBe(750); // 5000 * 0.15
      expect(result.demandCost).toBe(360); // 30 * 12
      // Steps below = 2, Penalty = 2 * 0.005 * (750 + 360) = 11.1
      expect(result.pfPenalty).toBeCloseTo(11.1, 1);
      expect(result.totalCost).toBeCloseTo(1171.1, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero consumption', () => {
      const result = powerCost({
        energyConsumption: 0,
        energyRate: 0.12,
        demandPeak: 0,
        demandRate: 10,
        powerFactor: 0.85,
        pfPenaltyThreshold: 0.90,
        pfPenaltyRate: 0.01,
        fixedCharges: 100,
      });

      expect(result.energyCost).toBe(0);
      expect(result.demandCost).toBe(0);
      expect(result.pfPenalty).toBe(0);
      expect(result.totalCost).toBe(100); // Only fixed charges
    });

    it('should handle PF exactly at threshold', () => {
      const result = powerCost({
        energyConsumption: 10000,
        energyRate: 0.10,
        demandPeak: 100,
        demandRate: 10,
        powerFactor: 0.90, // Exactly at threshold
        pfPenaltyThreshold: 0.90,
        pfPenaltyRate: 0.01,
        fixedCharges: 0,
      });

      expect(result.pfPenalty).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate typical commercial building bill', () => {
      const result = powerCost({
        energyConsumption: 50000, // 50,000 kWh
        energyRate: 0.11,
        demandPeak: 200, // 200 kW peak
        demandRate: 15,
        powerFactor: 0.92,
        pfPenaltyThreshold: 0.90,
        pfPenaltyRate: 0,
        fixedCharges: 250,
      });

      expect(result.energyCost).toBe(5500);
      expect(result.demandCost).toBe(3000);
      expect(result.totalCost).toBe(8750);
    });
  });
});
