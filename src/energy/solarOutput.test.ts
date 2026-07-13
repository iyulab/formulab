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
      // Tilt efficiency ≈ 1.0 (latitude tilt, equator-facing — near the scanned optimum)
      expect(result.tiltEfficiency).toBeGreaterThan(0.99);
      // Daily = 4 * 5 * 0.80 * ~1.0 = ~16 kWh
      expect(result.dailyOutputKwh).toBeCloseTo(16, 0);
      expect(result.monthlyOutputKwh).toBeCloseTo(480, -1);
      expect(result.annualOutputKwh).toBeGreaterThan(5750);
      expect(result.annualOutputKwh).toBeLessThanOrEqual(5840);
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

  describe('isotropic-sky orientation model (replaces the 0.5-floored cos approximation)', () => {
    const base = {
      panelWattage: 400, panelCount: 10, peakSunHours: 5,
      systemEfficiency: 0.80, latitude: 37,
    };

    it('north-facing array is physically derived, not pinned at 50% of south', () => {
      const north = solarOutput({ ...base, tiltAngle: 30, azimuthOffset: 180 });
      const south = solarOutput({ ...base, tiltAngle: 30, azimuthOffset: 0 });

      // Lave & Kleissl 2011: north at ~latitude tilt ≈ 0.6-0.7 of optimal across CONUS
      const ratio = north.annualOutputKwh / south.annualOutputKwh;
      expect(ratio).toBeGreaterThan(0.55);
      expect(ratio).toBeLessThan(0.7);
      expect(ratio).not.toBeCloseTo(0.5, 2); // the old floor artifact
      expect(north.tiltEfficiency).toBeCloseTo(0.61, 2); // model golden pin (lat 37, tilt 30)
    });

    it('tilt now matters for away-facing arrays (the floor made them all identical)', () => {
      const shallow = solarOutput({ ...base, tiltAngle: 10, azimuthOffset: 180 });
      const moderate = solarOutput({ ...base, tiltAngle: 30, azimuthOffset: 180 });
      const steep = solarOutput({ ...base, tiltAngle: 60, azimuthOffset: 180 });

      expect(shallow.tiltEfficiency).toBeGreaterThan(moderate.tiltEfficiency);
      expect(moderate.tiltEfficiency).toBeGreaterThan(steep.tiltEfficiency);
      expect(steep.tiltEfficiency).toBeCloseTo(0.38, 2); // model golden pin
    });

    it('matches published PVWatts-derived anchors for east/west and flat', () => {
      const east = solarOutput({ ...base, tiltAngle: 30, azimuthOffset: 90 });
      const flat = solarOutput({ ...base, tiltAngle: 0, azimuthOffset: 0 });

      expect(east.tiltEfficiency).toBeGreaterThan(0.75); // E/W band 0.75-0.88
      expect(east.tiltEfficiency).toBeLessThan(0.88);
      expect(flat.tiltEfficiency).toBeGreaterThan(0.85); // flat ≈ 0.88 at lat 37
      expect(flat.tiltEfficiency).toBeLessThan(0.92);
    });

    it('flat arrays are azimuth-independent', () => {
      const a = solarOutput({ ...base, tiltAngle: 0, azimuthOffset: 0 });
      const b = solarOutput({ ...base, tiltAngle: 0, azimuthOffset: 180 });

      expect(a.tiltEfficiency).toBe(b.tiltEfficiency);
    });

    it('equator (latitude 0) optimum is a flat array', () => {
      const result = solarOutput({ ...base, latitude: 0, tiltAngle: 0, azimuthOffset: 0 });
      expect(result.tiltEfficiency).toBe(1);
    });

    it('validates tilt and latitude ranges', () => {
      expect(() => solarOutput({ ...base, tiltAngle: -1, azimuthOffset: 0 })).toThrow(RangeError);
      expect(() => solarOutput({ ...base, tiltAngle: 91, azimuthOffset: 0 })).toThrow(RangeError);
      expect(() => solarOutput({ ...base, tiltAngle: 30, azimuthOffset: 0, latitude: 95 })).toThrow(RangeError);
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
