import { describe, it, expect } from 'vitest';
import { ppk } from './ppk.js';

describe('ppk', () => {
  describe('Pp calculation', () => {
    it('should calculate Pp (process performance spread) correctly', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 3,
      });

      // Pp = (USL - LSL) / 6σ = (110 - 90) / (6 * 3) = 20 / 18 = 1.11
      expect(result.pp).toBeCloseTo(1.11, 1);
    });
  });

  describe('Ppk calculation', () => {
    it('should calculate Ppk as minimum of Ppu and Ppl', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 3,
      });

      // Ppu = (USL - mean) / 3σ = (110 - 100) / 9 = 1.11
      // Ppl = (mean - LSL) / 3σ = (100 - 90) / 9 = 1.11
      // Ppk = min(1.11, 1.11) = 1.11
      expect(result.ppk).toBeCloseTo(1.11, 1);
    });

    it('should return lower Ppk when process is off-center (high)', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 105,
        stdDev: 3,
      });

      // Ppu = (110 - 105) / 9 = 0.56
      // Ppl = (105 - 90) / 9 = 1.67
      // Ppk = min(0.56, 1.67) = 0.56
      expect(result.ppk).toBeCloseTo(0.56, 1);
      expect(result.ppUpper).toBeLessThan(result.ppLower);
    });

    it('should return lower Ppk when process is off-center (low)', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 95,
        stdDev: 3,
      });

      // Ppu = (110 - 95) / 9 = 1.67
      // Ppl = (95 - 90) / 9 = 0.56
      // Ppk = min(1.67, 0.56) = 0.56
      expect(result.ppk).toBeCloseTo(0.56, 1);
      expect(result.ppLower).toBeLessThan(result.ppUpper);
    });
  });

  describe('within spec percent', () => {
    it('should calculate within spec percent correctly for centered process', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 3,
      });

      // Z_upper = (110 - 100) / 3 = 3.33
      // Z_lower = (90 - 100) / 3 = -3.33
      // Within spec ≈ 99.91%
      expect(result.withinSpecPercent).toBeGreaterThan(99);
    });

    it('should calculate lower within spec percent for wider process', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 10,
      });

      // Z_upper = 10 / 10 = 1
      // Z_lower = -10 / 10 = -1
      // Within spec ≈ 68.27%
      expect(result.withinSpecPercent).toBeCloseTo(68.3, 0);
    });
  });

  describe('sigma level', () => {
    it('should calculate sigma level correctly', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 3,
      });

      // Sigma = 3 * Ppk = 3 * 1.11 = 3.33
      expect(result.sigma).toBeCloseTo(3.33, 1);
    });

    it('should show 6 sigma capability', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 1.67, // 6σ would need stdDev = 20/(6*2) = 1.67
      });

      expect(result.ppk).toBeCloseTo(2.0, 1);
      expect(result.sigma).toBeCloseTo(6.0, 0);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero standard deviation', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 0,
      });

      expect(result.pp).toBe(0);
      expect(result.ppk).toBe(0);
      expect(result.withinSpecPercent).toBe(0);
    });

    it('should return zeros for negative standard deviation', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: -1,
      });

      expect(result.pp).toBe(0);
      expect(result.ppk).toBe(0);
    });

    it('should handle mean outside spec limits', () => {
      const result = ppk({
        usl: 110,
        lsl: 90,
        mean: 115, // Outside USL
        stdDev: 3,
      });

      // Ppu = (110 - 115) / 9 = -0.56
      expect(result.ppUpper).toBeLessThan(0);
      expect(result.ppk).toBeLessThan(0);
    });

    it('should handle narrow specification', () => {
      const result = ppk({
        usl: 101,
        lsl: 99,
        mean: 100,
        stdDev: 1,
      });

      // Pp = 2 / 6 = 0.33
      expect(result.pp).toBeCloseTo(0.33, 1);
    });
  });

  describe('real-world scenarios', () => {
    it('should analyze machining process', () => {
      // Dimension: 25.00 ± 0.05 mm
      const result = ppk({
        usl: 25.05,
        lsl: 24.95,
        mean: 25.01,
        stdDev: 0.015,
      });

      // Pp = 0.10 / (6 * 0.015) = 1.11
      expect(result.pp).toBeCloseTo(1.11, 1);
      expect(result.withinSpecPercent).toBeGreaterThan(99);
    });

    it('should analyze fill weight process', () => {
      // Target: 500g, spec: 495-505g
      const result = ppk({
        usl: 505,
        lsl: 495,
        mean: 501,
        stdDev: 1.5,
      });

      expect(result.pp).toBeCloseTo(1.11, 1);
      // Off-center toward USL
      expect(result.ppUpper).toBeLessThan(result.ppLower);
    });

    it('should analyze temperature control process', () => {
      // Target: 180°C, spec: 175-185°C
      const result = ppk({
        usl: 185,
        lsl: 175,
        mean: 180,
        stdDev: 1,
      });

      // Pp = 10 / 6 = 1.67
      expect(result.pp).toBeCloseTo(1.67, 1);
      expect(result.sigma).toBeCloseTo(5, 0);
    });

    it('should identify incapable process', () => {
      const result = ppk({
        usl: 102,
        lsl: 98,
        mean: 100,
        stdDev: 2,
      });

      // Pp = 4 / 12 = 0.33
      expect(result.pp).toBeCloseTo(0.33, 1);
      expect(result.ppk).toBeLessThan(1);
      expect(result.withinSpecPercent).toBeLessThan(95);
    });
  });
});
