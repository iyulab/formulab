import { describe, it, expect } from 'vitest';
import { batteryRuntime } from './batteryRuntime.js';

describe('batteryRuntime', () => {
  describe('energy calculation', () => {
    it('should calculate energy in Wh correctly', () => {
      const result = batteryRuntime({
        capacityAh: 100,
        voltageV: 12,
        loadW: 100,
        efficiency: 1,
      });

      // Energy = 100 Ah × 12 V = 1200 Wh
      expect(result.energyWh).toBe(1200);
    });

    it('should calculate energy in kWh correctly', () => {
      const result = batteryRuntime({
        capacityAh: 100,
        voltageV: 48,
        loadW: 500,
        efficiency: 1,
      });

      // Energy = 100 × 48 = 4800 Wh = 4.8 kWh
      expect(result.energyKwh).toBe(4.8);
    });
  });

  describe('runtime calculation', () => {
    it('should calculate runtime hours correctly', () => {
      const result = batteryRuntime({
        capacityAh: 100,
        voltageV: 12,
        loadW: 120,
        efficiency: 1,
      });

      // Runtime = 1200 Wh / 120 W = 10 hours
      expect(result.runtimeHours).toBe(10);
    });

    it('should calculate runtime with efficiency factor', () => {
      const result = batteryRuntime({
        capacityAh: 100,
        voltageV: 12,
        loadW: 120,
        efficiency: 0.85,
      });

      // Runtime = 1200 × 0.85 / 120 = 8.5 hours
      expect(result.runtimeHours).toBe(8.5);
    });

    it('should calculate runtime in minutes', () => {
      const result = batteryRuntime({
        capacityAh: 10,
        voltageV: 12,
        loadW: 120,
        efficiency: 1,
      });

      // Runtime = 120 Wh / 120 W = 1 hour = 60 min
      expect(result.runtimeMinutes).toBe(60);
    });
  });

  describe('current draw calculation', () => {
    it('should calculate current draw correctly', () => {
      const result = batteryRuntime({
        capacityAh: 100,
        voltageV: 12,
        loadW: 120,
        efficiency: 1,
      });

      // Current = 120 W / 12 V = 10 A
      expect(result.currentDraw).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle zero voltage', () => {
      const result = batteryRuntime({
        capacityAh: 100,
        voltageV: 0,
        loadW: 100,
        efficiency: 1,
      });

      expect(result.energyWh).toBe(0);
      expect(result.runtimeHours).toBe(0);
      expect(result.currentDraw).toBe(0);
    });

    it('should handle zero load', () => {
      const result = batteryRuntime({
        capacityAh: 100,
        voltageV: 12,
        loadW: 0,
        efficiency: 1,
      });

      expect(result.energyWh).toBe(1200);
      expect(result.runtimeHours).toBe(0);
      expect(result.currentDraw).toBe(0);
    });

    it('should handle negative voltage', () => {
      const result = batteryRuntime({
        capacityAh: 100,
        voltageV: -12,
        loadW: 100,
        efficiency: 1,
      });

      expect(result.energyWh).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate car battery for accessories', () => {
      const result = batteryRuntime({
        capacityAh: 60,
        voltageV: 12,
        loadW: 50,  // Radio, lights
        efficiency: 0.9,
      });

      // Energy = 720 Wh, Runtime = 720 × 0.9 / 50 = 12.96 hours
      expect(result.runtimeHours).toBeCloseTo(12.96, 1);
    });

    it('should calculate EV battery for driving', () => {
      const result = batteryRuntime({
        capacityAh: 150,
        voltageV: 400,
        loadW: 15000,  // Average power consumption
        efficiency: 0.9,
      });

      // Energy = 60 kWh
      expect(result.energyKwh).toBe(60);
      // Runtime = 60 × 0.9 / 15 = 3.6 hours
      expect(result.runtimeHours).toBe(3.6);
    });

    it('should calculate UPS backup time', () => {
      const result = batteryRuntime({
        capacityAh: 7,
        voltageV: 12,
        loadW: 500,
        efficiency: 0.8,
      });

      // Energy = 84 Wh, Runtime = 84 × 0.8 / 500 = 0.13 hours = 8 min
      expect(result.runtimeMinutes).toBeCloseTo(8.06, 1);
    });

    it('should calculate solar battery storage', () => {
      const result = batteryRuntime({
        capacityAh: 200,
        voltageV: 48,
        loadW: 1000,
        efficiency: 0.95,
      });

      // Energy = 9.6 kWh, Runtime = 9.6 × 0.95 / 1 = 9.12 hours
      expect(result.energyKwh).toBe(9.6);
      expect(result.runtimeHours).toBeCloseTo(9.12, 1);
    });
  });
});
