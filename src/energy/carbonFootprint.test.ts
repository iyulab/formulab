import { describe, it, expect } from 'vitest';
import { carbonFootprint } from './carbonFootprint.js';

describe('carbonFootprint', () => {
  describe('CO2 calculations', () => {
    it('should calculate CO2 in kg correctly', () => {
      // 1000 kWh * 500 g/kWh = 500,000 g = 500 kg
      const result = carbonFootprint({
        electricityUsage: 1000,
        emissionFactor: 500,
      });

      expect(result.co2Kg).toBe(500);
    });

    it('should calculate CO2 in tonnes correctly', () => {
      const result = carbonFootprint({
        electricityUsage: 10000,
        emissionFactor: 500,
      });

      // 10000 * 500 / 1000 = 5000 kg = 5 tonnes
      expect(result.co2Kg).toBe(5000);
      expect(result.co2Tonnes).toBe(5);
    });

    it('should handle different emission factors', () => {
      // Clean grid (e.g., France nuclear): ~50 g/kWh
      const cleanResult = carbonFootprint({
        electricityUsage: 1000,
        emissionFactor: 50,
      });
      expect(cleanResult.co2Kg).toBe(50);

      // Coal-heavy grid: ~900 g/kWh
      const dirtyResult = carbonFootprint({
        electricityUsage: 1000,
        emissionFactor: 900,
      });
      expect(dirtyResult.co2Kg).toBe(900);
    });
  });

  describe('trees equivalent', () => {
    it('should calculate trees needed to offset emissions', () => {
      // 217.6 kg CO2 / 21.76 kg per tree = 10 trees
      const result = carbonFootprint({
        electricityUsage: 2176,
        emissionFactor: 100, // 217.6 kg CO2
      });

      expect(result.treesEquivalent).toBe(10);
    });

    it('should round trees to nearest integer', () => {
      const result = carbonFootprint({
        electricityUsage: 1000,
        emissionFactor: 500, // 500 kg CO2
      });

      // 500 / 21.76 = 22.98 ≈ 23
      expect(result.treesEquivalent).toBe(23);
    });
  });

  describe('cars equivalent', () => {
    it('should calculate cars equivalent correctly', () => {
      // 4600 kg CO2 = 1 car year
      const result = carbonFootprint({
        electricityUsage: 9200,
        emissionFactor: 500, // 4600 kg CO2
      });

      expect(result.carsEquivalent).toBe(1);
    });

    it('should handle fractional cars', () => {
      const result = carbonFootprint({
        electricityUsage: 4600,
        emissionFactor: 500, // 2300 kg CO2
      });

      expect(result.carsEquivalent).toBe(0.5);
    });
  });

  describe('edge cases', () => {
    it('should handle zero electricity usage', () => {
      const result = carbonFootprint({
        electricityUsage: 0,
        emissionFactor: 500,
      });

      expect(result.co2Kg).toBe(0);
      expect(result.co2Tonnes).toBe(0);
      expect(result.treesEquivalent).toBe(0);
      expect(result.carsEquivalent).toBe(0);
    });

    it('should handle negative electricity usage', () => {
      const result = carbonFootprint({
        electricityUsage: -100,
        emissionFactor: 500,
      });

      expect(result.co2Kg).toBe(0);
    });

    it('should handle very small usage', () => {
      const result = carbonFootprint({
        electricityUsage: 1,
        emissionFactor: 500,
      });

      expect(result.co2Kg).toBe(0.5);
      expect(result.co2Tonnes).toBe(0.0005);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate average US household footprint', () => {
      // Average US household: ~10,500 kWh/year
      // US grid average: ~400 g/kWh
      const result = carbonFootprint({
        electricityUsage: 10500,
        emissionFactor: 400,
      });

      expect(result.co2Kg).toBe(4200);
      expect(result.co2Tonnes).toBe(4.2);
      // ~193 trees needed to offset
      expect(result.treesEquivalent).toBe(193);
      // ~0.91 cars equivalent
      expect(result.carsEquivalent).toBeCloseTo(0.91, 1);
    });

    it('should calculate data center footprint', () => {
      // Small data center: 1,000,000 kWh/year
      const result = carbonFootprint({
        electricityUsage: 1000000,
        emissionFactor: 400,
      });

      expect(result.co2Tonnes).toBe(400);
      // ~87 cars equivalent
      expect(result.carsEquivalent).toBeCloseTo(86.96, 1);
    });

    it('should calculate with renewable energy factor', () => {
      // Renewable energy: ~20 g/kWh (lifecycle)
      const result = carbonFootprint({
        electricityUsage: 10000,
        emissionFactor: 20,
      });

      expect(result.co2Kg).toBe(200);
      expect(result.co2Tonnes).toBe(0.2);
    });
  });
});
