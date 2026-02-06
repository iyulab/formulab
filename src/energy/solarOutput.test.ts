import { describe, it, expect } from 'vitest';
import { solarOutput } from './solarOutput.js';

describe('solarOutput', () => {
  describe('basic calculations', () => {
    it('should calculate output for a typical residential system', () => {
      const result = solarOutput({
        panelWattage: 400,
        panelCount: 10,
        peakSunHours: 5,
        systemEfficiency: 0.80,
        tiltAngle: 35,
        latitude: 35,
        azimuthOffset: 0,
      });
      // System size = 400 * 10 / 1000 = 4 kW
      expect(result.systemSizeKw).toBe(4);
      // Tilt efficiency ≈ 1.0 (optimal tilt matches latitude, azimuth 0)
      expect(result.tiltEfficiency).toBeCloseTo(1.0, 1);
      // Daily = 4 * 5 * 0.80 * ~1.0 = ~16 kWh
      expect(result.dailyOutputKwh).toBeCloseTo(16, 0);
      expect(result.monthlyOutputKwh).toBeCloseTo(480, 0);
      expect(result.annualOutputKwh).toBeCloseTo(5840, -1);
    });

    it('should calculate capacity factor', () => {
      const result = solarOutput({
        panelWattage: 300,
        panelCount: 20,
        peakSunHours: 4,
        systemEfficiency: 0.80,
        tiltAngle: 30,
        latitude: 30,
        azimuthOffset: 0,
      });
      // System = 6 kW, daily ≈ 6*4*0.80*1.0 = 19.2 kWh
      // Capacity factor = 19.2 / (6*24) ≈ 0.133
      expect(result.capacityFactor).toBeCloseTo(0.133, 2);
    });
  });

  describe('tilt and azimuth effects', () => {
    it('should reduce output for suboptimal tilt', () => {
      const optimal = solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 35, latitude: 35, azimuthOffset: 0,
      });
      const flat = solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 0, latitude: 35, azimuthOffset: 0,
      });
      expect(flat.dailyOutputKwh).toBeLessThan(optimal.dailyOutputKwh);
    });

    it('should reduce output for east/west facing', () => {
      const south = solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 35, latitude: 35, azimuthOffset: 0,
      });
      const east = solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 35, latitude: 35, azimuthOffset: 90,
      });
      expect(east.dailyOutputKwh).toBeLessThan(south.dailyOutputKwh);
    });
  });

  describe('validation', () => {
    it('should throw on zero panel wattage', () => {
      expect(() => solarOutput({
        panelWattage: 0, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 35, latitude: 35, azimuthOffset: 0,
      })).toThrow();
    });

    it('should throw on invalid efficiency', () => {
      expect(() => solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 1.5, tiltAngle: 35, latitude: 35, azimuthOffset: 0,
      })).toThrow();
    });
  });
});
