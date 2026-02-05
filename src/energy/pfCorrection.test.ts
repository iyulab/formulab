import { describe, it, expect } from 'vitest';
import { pfCorrection } from './pfCorrection.js';

describe('pfCorrection', () => {
  describe('kVA calculation', () => {
    it('should calculate current kVA correctly', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.80,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      // kVA = 100 / 0.80 = 125
      expect(result.currentKva).toBe(125);
    });

    it('should calculate target kVA correctly', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.80,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      // kVA = 100 / 0.95 = 105.26
      expect(result.targetKva).toBeCloseTo(105.26, 1);
    });
  });

  describe('kVAR calculation', () => {
    it('should calculate required kVAR correctly', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.80,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      // kVAR = kW × (tan(arccos(0.80)) - tan(arccos(0.95)))
      // = 100 × (0.75 - 0.329) = 100 × 0.421 = 42.1 kVAR
      expect(result.kvarRequired).toBeCloseTo(42.1, 0);
    });
  });

  describe('capacitor cost calculation', () => {
    it('should calculate capacitor cost correctly', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.80,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      // Cost = 42.1 × 50 = $2,105
      expect(result.capacitorCost).toBeCloseTo(2105, -1);
    });
  });

  describe('penalty calculation', () => {
    it('should calculate current monthly penalty', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.80,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,      // 1% penalty per 0.01 PF below threshold
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      // PF below threshold: 0.90 - 0.80 = 0.10 = 9 steps (floor of 10)
      // Monthly kWh = 100 × 200 = 20,000
      // Energy cost = 20,000 × 0.10 = $2,000
      // Penalty = 9 × 0.01 × 2,000 = $180
      expect(result.currentMonthlyPenalty).toBe(180);
    });

    it('should calculate no penalty when PF above threshold', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.92,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      expect(result.currentMonthlyPenalty).toBe(0);
    });

    it('should calculate new penalty after correction', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.80,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      // Target PF 0.95 > threshold 0.90, no penalty
      expect(result.newMonthlyPenalty).toBe(0);
    });
  });

  describe('savings calculation', () => {
    it('should calculate monthly savings correctly', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.80,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      // Savings = current penalty - new penalty = 180 - 0 = $180
      expect(result.monthlySavings).toBe(180);
    });

    it('should calculate annual savings correctly', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.80,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      // Annual = 180 × 12 = $2,160
      expect(result.annualSavings).toBe(2160);
    });
  });

  describe('payback calculation', () => {
    it('should calculate payback in months', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.80,
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      // Payback = capacitorCost / monthlySavings = 2105.5 / 180 ≈ 11.7 months
      expect(result.paybackMonths).toBeCloseTo(11.7, 0);
    });

    it('should return zero when no savings', () => {
      const result = pfCorrection({
        kW: 100,
        currentPf: 0.92,    // Already above threshold
        targetPf: 0.95,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 50,
      });

      expect(result.paybackMonths).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate manufacturing plant correction', () => {
      const result = pfCorrection({
        kW: 500,
        currentPf: 0.75,
        targetPf: 0.95,
        electricityRate: 0.12,
        monthlyUsageHours: 500,
        pfPenaltyRate: 0.015,
        pfPenaltyThreshold: 0.85,
        capacitorCostPerKvar: 45,
      });

      expect(result.kvarRequired).toBeGreaterThan(200);
      expect(result.annualSavings).toBeGreaterThan(0);
    });

    it('should calculate commercial building correction', () => {
      const result = pfCorrection({
        kW: 200,
        currentPf: 0.82,
        targetPf: 0.92,
        electricityRate: 0.14,
        monthlyUsageHours: 300,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.90,
        capacitorCostPerKvar: 55,
      });

      expect(result.currentKva).toBeGreaterThan(result.targetKva);
    });

    it('should calculate small workshop correction', () => {
      const result = pfCorrection({
        kW: 50,
        currentPf: 0.70,
        targetPf: 0.90,
        electricityRate: 0.10,
        monthlyUsageHours: 200,
        pfPenaltyRate: 0.01,
        pfPenaltyThreshold: 0.85,
        capacitorCostPerKvar: 60,
      });

      expect(result.paybackMonths).toBeGreaterThan(0);
    });
  });
});
