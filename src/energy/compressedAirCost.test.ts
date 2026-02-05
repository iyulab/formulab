import { describe, it, expect } from 'vitest';
import { compressedAirCost } from './compressedAirCost.js';

describe('compressedAirCost', () => {
  describe('electricity cost calculation', () => {
    it('should calculate electricity cost correctly', () => {
      const result = compressedAirCost({
        compressorPower: 50,       // 50 kW
        runningHours: 100,         // 100 hours
        electricityRate: 0.12,     // $0.12/kWh
        airOutput: 10000,          // 10,000 m³
        maintenanceCost: 0,
      });

      // Electricity = 50 × 100 × 0.12 = $600
      expect(result.electricityCost).toBe(600);
    });
  });

  describe('total cost calculation', () => {
    it('should calculate total cost with maintenance', () => {
      const result = compressedAirCost({
        compressorPower: 50,
        runningHours: 100,
        electricityRate: 0.12,
        airOutput: 10000,
        maintenanceCost: 100,
      });

      // Total = 600 + 100 = $700
      expect(result.totalCost).toBe(700);
    });

    it('should equal electricity cost when no maintenance', () => {
      const result = compressedAirCost({
        compressorPower: 50,
        runningHours: 100,
        electricityRate: 0.12,
        airOutput: 10000,
        maintenanceCost: 0,
      });

      expect(result.totalCost).toBe(result.electricityCost);
    });
  });

  describe('cost per unit calculation', () => {
    it('should calculate cost per m³ correctly', () => {
      const result = compressedAirCost({
        compressorPower: 50,
        runningHours: 100,
        electricityRate: 0.12,
        airOutput: 10000,
        maintenanceCost: 0,
      });

      // Cost per m³ = 600 / 10000 = $0.06
      expect(result.costPerM3).toBe(0.06);
    });

    it('should calculate cost per CFM correctly', () => {
      const result = compressedAirCost({
        compressorPower: 50,
        runningHours: 100,
        electricityRate: 0.12,
        airOutput: 10000,
        maintenanceCost: 0,
      });

      // Cost per CFM = 0.06 / 35.3147 ≈ $0.0017
      expect(result.costPerCfm).toBeCloseTo(0.0017, 3);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero compressor power', () => {
      const result = compressedAirCost({
        compressorPower: 0,
        runningHours: 100,
        electricityRate: 0.12,
        airOutput: 10000,
        maintenanceCost: 50,
      });

      expect(result.electricityCost).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it('should return zeros for zero running hours', () => {
      const result = compressedAirCost({
        compressorPower: 50,
        runningHours: 0,
        electricityRate: 0.12,
        airOutput: 10000,
        maintenanceCost: 50,
      });

      expect(result.electricityCost).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it('should return zeros for zero air output', () => {
      const result = compressedAirCost({
        compressorPower: 50,
        runningHours: 100,
        electricityRate: 0.12,
        airOutput: 0,
        maintenanceCost: 50,
      });

      expect(result.costPerM3).toBe(0);
      expect(result.costPerCfm).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate small shop compressor cost', () => {
      const result = compressedAirCost({
        compressorPower: 7.5,      // 10 HP compressor
        runningHours: 160,         // 20 days × 8 hours
        electricityRate: 0.15,     // $0.15/kWh
        airOutput: 2000,           // 2000 m³/month
        maintenanceCost: 50,       // Monthly maintenance
      });

      // Electricity = 7.5 × 160 × 0.15 = $180
      // Total = $230
      expect(result.electricityCost).toBe(180);
      expect(result.totalCost).toBe(230);
    });

    it('should calculate industrial plant compressor cost', () => {
      const result = compressedAirCost({
        compressorPower: 250,      // Large rotary screw
        runningHours: 720,         // 24/7 operation (30 days)
        electricityRate: 0.10,     // Industrial rate
        airOutput: 500000,         // High output
        maintenanceCost: 1500,     // Monthly maintenance
      });

      // Electricity = 250 × 720 × 0.10 = $18,000
      expect(result.electricityCost).toBe(18000);
      expect(result.totalCost).toBe(19500);
    });

    it('should calculate automotive shop air cost', () => {
      const result = compressedAirCost({
        compressorPower: 15,
        runningHours: 200,
        electricityRate: 0.12,
        airOutput: 5000,
        maintenanceCost: 75,
      });

      // Electricity = 15 × 200 × 0.12 = $360
      expect(result.electricityCost).toBe(360);
      expect(result.costPerM3).toBeCloseTo(0.087, 2);
    });
  });

  describe('sensitivity analysis', () => {
    it('should show electricity rate impact', () => {
      const lowRate = compressedAirCost({
        compressorPower: 50,
        runningHours: 100,
        electricityRate: 0.08,
        airOutput: 10000,
        maintenanceCost: 0,
      });

      const highRate = compressedAirCost({
        compressorPower: 50,
        runningHours: 100,
        electricityRate: 0.16,
        airOutput: 10000,
        maintenanceCost: 0,
      });

      // Double rate = double cost
      expect(highRate.electricityCost).toBe(lowRate.electricityCost * 2);
    });

    it('should show running hours impact', () => {
      const lowHours = compressedAirCost({
        compressorPower: 50,
        runningHours: 100,
        electricityRate: 0.12,
        airOutput: 10000,
        maintenanceCost: 0,
      });

      const highHours = compressedAirCost({
        compressorPower: 50,
        runningHours: 200,
        electricityRate: 0.12,
        airOutput: 10000,
        maintenanceCost: 0,
      });

      expect(highHours.electricityCost).toBe(lowHours.electricityCost * 2);
    });
  });
});
