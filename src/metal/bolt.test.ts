import { describe, it, expect } from 'vitest';
import { bolt, getKFactor, getStandardPitch } from './bolt.js';

describe('bolt', () => {
  describe('torque to preload conversion', () => {
    it('should calculate preload from torque for M10 bolt', () => {
      const result = bolt({
        mode: 'torqueToPreload',
        diameter: 10,
        pitch: 1.5,
        torque: 50, // N-m
        kFactor: 0.2,
        tensileStrength: 800, // MPa
      });

      expect(result.preloadN).toBeGreaterThan(0);
      expect(result.preload).toBeGreaterThan(0);
      expect(result.stressArea).toBeGreaterThan(0);
    });

    it('should increase preload with higher torque', () => {
      const low = bolt({
        mode: 'torqueToPreload',
        diameter: 10,
        pitch: 1.5,
        torque: 30,
        kFactor: 0.2,
        tensileStrength: 800,
      });

      const high = bolt({
        mode: 'torqueToPreload',
        diameter: 10,
        pitch: 1.5,
        torque: 60,
        kFactor: 0.2,
        tensileStrength: 800,
      });

      expect(high.preloadN).toBeGreaterThan(low.preloadN);
    });
  });

  describe('preload to torque conversion', () => {
    it('should calculate torque from preload for M12 bolt', () => {
      const result = bolt({
        mode: 'preloadToTorque',
        diameter: 12,
        pitch: 1.75,
        preload: 30, // kN
        kFactor: 0.15,
        tensileStrength: 800,
      });

      expect(result.torque).toBeGreaterThan(0);
    });

    it('should require more torque with higher K-factor', () => {
      const oiled = bolt({
        mode: 'preloadToTorque',
        diameter: 10,
        pitch: 1.5,
        preload: 25,
        kFactor: 0.15, // oiled
        tensileStrength: 800,
      });

      const dry = bolt({
        mode: 'preloadToTorque',
        diameter: 10,
        pitch: 1.5,
        preload: 25,
        kFactor: 0.20, // dry
        tensileStrength: 800,
      });

      expect(dry.torque).toBeGreaterThan(oiled.torque);
    });
  });

  describe('stress area calculation', () => {
    it('should calculate tensile stress area correctly', () => {
      const result = bolt({
        mode: 'torqueToPreload',
        diameter: 10,
        pitch: 1.5,
        torque: 40,
        kFactor: 0.2,
        tensileStrength: 800,
      });

      // As = (pi/4) * (d - 0.9382*p)^2
      // As = (pi/4) * (10 - 1.4073)^2 = 58.0 mm²
      expect(result.stressArea).toBeCloseTo(58.0, 0);
    });
  });

  describe('strength utilization', () => {
    it('should calculate strength utilization percentage', () => {
      const result = bolt({
        mode: 'torqueToPreload',
        diameter: 10,
        pitch: 1.5,
        torque: 50,
        kFactor: 0.2,
        tensileStrength: 800,
      });

      expect(result.strengthUtilization).toBeGreaterThan(0);
      expect(result.strengthUtilization).toBeLessThan(100);
    });

    it('should calculate recommended max preload at 75% strength', () => {
      const result = bolt({
        mode: 'torqueToPreload',
        diameter: 10,
        pitch: 1.5,
        torque: 40,
        kFactor: 0.2,
        tensileStrength: 800,
      });

      expect(result.recommendedMaxPreload).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for invalid diameter', () => {
      const result = bolt({
        mode: 'torqueToPreload',
        diameter: 0,
        pitch: 1.5,
        torque: 40,
        kFactor: 0.2,
        tensileStrength: 800,
      });

      expect(result.torque).toBe(0);
      expect(result.preload).toBe(0);
    });

    it('should return zeros for zero torque', () => {
      const result = bolt({
        mode: 'torqueToPreload',
        diameter: 10,
        pitch: 1.5,
        torque: 0,
        kFactor: 0.2,
        tensileStrength: 800,
      });

      expect(result.preloadN).toBe(0);
    });

    it('should return zeros for zero preload', () => {
      const result = bolt({
        mode: 'preloadToTorque',
        diameter: 10,
        pitch: 1.5,
        preload: 0,
        kFactor: 0.2,
        tensileStrength: 800,
      });

      expect(result.torque).toBe(0);
    });
  });
});

describe('getKFactor', () => {
  it('should return 0.20 for dry condition', () => {
    expect(getKFactor('dry')).toBe(0.20);
  });

  it('should return 0.15 for oiled condition', () => {
    expect(getKFactor('oiled')).toBe(0.15);
  });

  it('should return 0.12 for moly condition', () => {
    expect(getKFactor('moly')).toBe(0.12);
  });

  it('should return 0.10 for ptfe condition', () => {
    expect(getKFactor('ptfe')).toBe(0.10);
  });

  it('should default to 0.20 for unknown condition', () => {
    expect(getKFactor('unknown')).toBe(0.20);
  });
});

describe('getStandardPitch', () => {
  it('should return correct pitch for M6', () => {
    expect(getStandardPitch(6)).toBe(1.0);
  });

  it('should return correct pitch for M10', () => {
    expect(getStandardPitch(10)).toBe(1.5);
  });

  it('should return correct pitch for M12', () => {
    expect(getStandardPitch(12)).toBe(1.75);
  });

  it('should return correct pitch for M20', () => {
    expect(getStandardPitch(20)).toBe(2.5);
  });

  it('should estimate pitch for non-standard diameter', () => {
    expect(getStandardPitch(25)).toBeGreaterThan(0);
  });
});
