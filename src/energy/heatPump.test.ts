import { describe, it, expect } from 'vitest';
import { heatPump } from './heatPump.js';

describe('heatPump', () => {
  describe('COP calculation', () => {
    it('should calculate COP correctly', () => {
      const result = heatPump({
        sourceTemp: 5, sinkTemp: 35,
        heatingCapacity: 10, compressorPower: 2.5,
      });

      expect(result.cop).toBeCloseTo(4.0, 2);
    });

    it('should include auxiliary power in COP', () => {
      const result = heatPump({
        sourceTemp: 5, sinkTemp: 35,
        heatingCapacity: 10, compressorPower: 2.5, auxiliaryPower: 0.5,
      });

      // COP = 10 / (2.5 + 0.5) = 3.333
      expect(result.cop).toBeCloseTo(3.333, 2);
    });
  });

  describe('Carnot COP', () => {
    it('should calculate Carnot COP', () => {
      // T_sink=35°C=308.15K, T_source=5°C=278.15K
      // COP_Carnot = 308.15 / (308.15 - 278.15) = 308.15 / 30 = 10.27
      const result = heatPump({
        sourceTemp: 5, sinkTemp: 35,
        heatingCapacity: 10, compressorPower: 2.5,
      });

      expect(result.copCarnot).toBeCloseTo(10.27, 1);
    });

    it('should compute efficiency as % of Carnot', () => {
      const result = heatPump({
        sourceTemp: 5, sinkTemp: 35,
        heatingCapacity: 10, compressorPower: 2.5,
      });

      // COP=4.0, Carnot=10.27 → efficiency ≈ 38.9%
      expect(result.efficiency).toBeCloseTo(38.9, 0);
    });
  });

  describe('annual calculations', () => {
    it('should return null when operatingHours not provided', () => {
      const result = heatPump({
        sourceTemp: 5, sinkTemp: 35,
        heatingCapacity: 10, compressorPower: 2.5,
      });

      expect(result.annualElectricity).toBeNull();
      expect(result.annualElecCost).toBeNull();
    });

    it('should compute annual electricity', () => {
      const result = heatPump({
        sourceTemp: 5, sinkTemp: 35,
        heatingCapacity: 10, compressorPower: 2.5,
        operatingHours: 2000, electricityRate: 0.1,
      });

      expect(result.annualElectricity).toBe(5000);
      expect(result.annualElecCost).toBe(500);
    });

    it('should compute savings vs boiler', () => {
      const result = heatPump({
        sourceTemp: 5, sinkTemp: 35,
        heatingCapacity: 10, compressorPower: 2.5,
        operatingHours: 2000, electricityRate: 0.1,
        boilerEfficiency: 0.85, fuelCost: 0.06,
      });

      expect(result.annualFuelCost).toBeGreaterThan(0);
      expect(result.annualSavings).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle zero compressor power', () => {
      const result = heatPump({
        sourceTemp: 5, sinkTemp: 35,
        heatingCapacity: 10, compressorPower: 0,
      });
      expect(result.cop).toBe(0);
    });

    it('should handle equal source and sink temps', () => {
      const result = heatPump({
        sourceTemp: 20, sinkTemp: 20,
        heatingCapacity: 10, compressorPower: 2.5,
      });
      // Carnot COP → infinite theoretically, but deltaT=0
      expect(result.copCarnot).toBe(0);
    });
  });
});
