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

  describe('floor disclosure (ISSUE-20260713 silent clamp)', () => {
    // Regression pin from the issue's execution evidence: north-facing roof at latitude 37,
    // tilt 30 → raw azimuth factor cos(108°) ≈ -0.309, floored to 0.5.
    it('flags a north-facing array (azimuthOffset 180°)', () => {
      const north = solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 30, latitude: 37, azimuthOffset: 180,
      });
      const south = solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 30, latitude: 37, azimuthOffset: 0,
      });

      expect(north.tiltEfficiencyFloored).toBe(true);
      expect(south.tiltEfficiencyFloored).toBe(false);
      // The floored result sits at exactly 50% of south-facing — the issue's symptom
      expect(north.annualOutputKwh / south.annualOutputKwh).toBeCloseTo(0.5, 2);
    });

    it('flags an extreme tilt deviation hitting the tilt-factor floor', () => {
      // tilt deviation must exceed 2×acos(0.5) = 240°... unreachable via tilt alone;
      // the tilt factor floors only for |tilt - latitude| > 120°, e.g. tilt 180 at latitude 55
      const result = solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 180, latitude: 55, azimuthOffset: 0,
      });

      expect(result.tiltEfficiencyFloored).toBe(true);
    });

    it('does not flag optimal or mildly off-optimal configurations', () => {
      const optimal = solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 35, latitude: 35, azimuthOffset: 0,
      });
      const east = solarOutput({
        panelWattage: 400, panelCount: 10, peakSunHours: 5,
        systemEfficiency: 0.80, tiltAngle: 35, latitude: 35, azimuthOffset: 90,
      });

      expect(optimal.tiltEfficiencyFloored).toBe(false);
      expect(east.tiltEfficiencyFloored).toBe(false); // cos(54°) ≈ 0.59 > 0.5
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
