import { describe, it, expect } from 'vitest';
import { cmk } from './cmk.js';

describe('cmk', () => {
  describe('normal cases', () => {
    it('should calculate Cmk for capable machine (centered)', () => {
      // 50 measurements clustered around 10.0, σ ≈ 0.5
      // USL=12, LSL=8 → spec width 4
      // Cm = 4/(6×0.5) = 1.333, Cmk = min(2/1.5, 2/1.5) = 1.333
      const measurements = Array.from({ length: 50 }, (_, i) =>
        10 + 0.5 * Math.cos(i * 0.1)
      );
      const result = cmk({ measurements, lsl: 8, usl: 12 });

      expect(result.mean).toBeCloseTo(10, 0);
      expect(result.stdDev).toBeGreaterThan(0);
      expect(result.cm).toBeGreaterThan(0);
      expect(result.cmk).toBeGreaterThan(0);
      expect(result.cmk).toBeLessThanOrEqual(result.cm);
    });

    it('should indicate capable when Cmk >= 1.67', () => {
      // Tight data → high Cmk
      const measurements = [10.0, 10.01, 9.99, 10.02, 9.98, 10.0, 10.01, 9.99, 10.0, 10.01,
        9.99, 10.0, 10.01, 9.99, 10.02, 9.98, 10.0, 10.01, 9.99, 10.0];
      const result = cmk({ measurements, lsl: 9.5, usl: 10.5 });

      expect(result.cmk).toBeGreaterThanOrEqual(1.67);
      expect(result.isCapable).toBe(true);
    });

    it('should indicate not capable when Cmk < 1.67', () => {
      // Wide data → low Cmk
      const measurements = [9.0, 11.0, 9.5, 10.5, 8.5, 11.5, 9.2, 10.8, 9.8, 10.2];
      const result = cmk({ measurements, lsl: 8, usl: 12 });

      expect(result.cmk).toBeLessThan(1.67);
      expect(result.isCapable).toBe(false);
    });
  });

  describe('off-center process', () => {
    it('should have Cmk < Cm when process is off-center', () => {
      // Mean shifted toward USL
      const measurements = [10.8, 10.9, 10.7, 10.85, 10.95, 10.75, 10.8, 10.9, 10.85, 10.7];
      const result = cmk({ measurements, lsl: 9, usl: 11 });

      expect(result.cmk).toBeLessThan(result.cm);
    });
  });

  describe('relationship to Cpk', () => {
    it('Cm formula should match Cp formula for same data', () => {
      const measurements = [10, 10.1, 9.9, 10.05, 9.95, 10.02, 9.98, 10.03, 9.97, 10.01];
      const result = cmk({ measurements, lsl: 9, usl: 11 });

      const n = measurements.length;
      const mean = measurements.reduce((s, v) => s + v, 0) / n;
      const stdDev = Math.sqrt(measurements.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
      const expectedCm = (11 - 9) / (6 * stdDev);

      expect(result.cm).toBeCloseTo(expectedCm, 2);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for empty measurements', () => {
      const result = cmk({ measurements: [], lsl: 0, usl: 10 });
      expect(result.mean).toBe(0);
      expect(result.cm).toBe(0);
      expect(result.cmk).toBe(0);
      expect(result.isCapable).toBe(false);
    });

    it('should handle single measurement', () => {
      const result = cmk({ measurements: [5], lsl: 0, usl: 10 });
      // Single measurement → stdDev = NaN from 0/0 division
      expect(result.cm).toBe(0);
      expect(result.isCapable).toBe(false);
    });

    it('should handle all identical measurements', () => {
      const result = cmk({ measurements: [5, 5, 5, 5, 5], lsl: 0, usl: 10 });
      expect(result.stdDev).toBe(0);
      expect(result.cm).toBe(0);
      expect(result.cmk).toBe(0);
      expect(result.isCapable).toBe(false);
    });
  });
});
