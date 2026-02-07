import { describe, it, expect } from 'vitest';
import { flowControl } from './flowControl.js';

describe('flowControl', () => {
  describe('liquid sizing', () => {
    it('should calculate Cv for water flow', () => {
      const result = flowControl({
        flowRate: 10,      // m³/h
        inletPressure: 500, // kPa
        outletPressure: 300, // kPa
        fluidDensity: 999,
        fluidType: 'liquid',
      });

      expect(result.cv).toBeGreaterThan(0);
      expect(result.kv).toBeCloseTo(result.cv * 0.865, 1);
      expect(result.pressureDrop).toBe(200);
      expect(result.isChoked).toBe(false);
    });

    it('should scale Cv with flow rate', () => {
      const base = {
        inletPressure: 500, outletPressure: 300,
        fluidDensity: 999, fluidType: 'liquid' as const,
      };

      const low = flowControl({ ...base, flowRate: 5 });
      const high = flowControl({ ...base, flowRate: 10 });

      expect(high.cv).toBeCloseTo(low.cv * 2, 0);
    });

    it('should handle zero pressure drop', () => {
      const result = flowControl({
        flowRate: 10, inletPressure: 500, outletPressure: 500,
        fluidDensity: 999, fluidType: 'liquid',
      });

      expect(result.cv).toBe(0);
      expect(result.pressureDrop).toBe(0);
    });
  });

  describe('gas sizing', () => {
    it('should calculate Cv for air flow', () => {
      const result = flowControl({
        flowRate: 100,     // m³/h
        inletPressure: 700, // kPa
        outletPressure: 500,
        fluidDensity: 1.2,
        fluidType: 'gas',
        molecularWeight: 29,
        temperature: 20,
      });

      expect(result.cv).toBeGreaterThan(0);
      expect(result.pressureDrop).toBe(200);
    });

    it('should detect choked flow', () => {
      const result = flowControl({
        flowRate: 100,
        inletPressure: 700,
        outletPressure: 100, // Large pressure drop
        fluidDensity: 1.2,
        fluidType: 'gas',
        molecularWeight: 29,
      });

      expect(result.isChoked).toBe(true);
    });
  });

  describe('Kv relationship', () => {
    it('should have Kv = 0.865 × Cv', () => {
      const result = flowControl({
        flowRate: 10, inletPressure: 500, outletPressure: 300,
        fluidDensity: 999, fluidType: 'liquid',
      });

      expect(result.kv).toBeCloseTo(result.cv * 0.865, 1);
    });
  });

  describe('pressure ratio', () => {
    it('should calculate pressure ratio correctly', () => {
      const result = flowControl({
        flowRate: 10, inletPressure: 500, outletPressure: 300,
        fluidDensity: 999, fluidType: 'liquid',
      });

      expect(result.pressureRatio).toBeCloseTo(0.4, 2);
    });
  });
});
