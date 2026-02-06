import { describe, it, expect } from 'vitest';
import { cpk } from './cpk.js';

describe('cpk', () => {
  describe('normal cases', () => {
    it('should calculate Cpk for centered process', () => {
      const result = cpk({
        usl: 110,
        lsl: 90,
        mean: 100,  // perfectly centered
        stdDev: 2,
      });

      // Cp = (110 - 90) / (6 * 2) = 20 / 12 = 1.667
      expect(result.cp).toBeCloseTo(1.667, 2);
      // Cpu = (110 - 100) / (3 * 2) = 10 / 6 = 1.667
      expect(result.cpu).toBeCloseTo(1.667, 2);
      // Cpl = (100 - 90) / (3 * 2) = 10 / 6 = 1.667
      expect(result.cpl).toBeCloseTo(1.667, 2);
      // Cpk = min(Cpu, Cpl) = 1.667
      expect(result.cpk).toBeCloseTo(1.667, 2);
      // Sigma level = 3 * Cpk = 5.0
      expect(result.sigmaLevel).toBeCloseTo(5.0, 1);
    });

    it('should calculate Cpk for off-center process (shifted high)', () => {
      const result = cpk({
        usl: 110,
        lsl: 90,
        mean: 105,  // shifted toward USL
        stdDev: 2,
      });

      // Cpu = (110 - 105) / (3 * 2) = 5 / 6 = 0.833
      expect(result.cpu).toBeCloseTo(0.833, 2);
      // Cpl = (105 - 90) / (3 * 2) = 15 / 6 = 2.5
      expect(result.cpl).toBeCloseTo(2.5, 2);
      // Cpk = min(0.833, 2.5) = 0.833
      expect(result.cpk).toBeCloseTo(0.833, 2);
    });

    it('should calculate Cpk for off-center process (shifted low)', () => {
      const result = cpk({
        usl: 110,
        lsl: 90,
        mean: 92,  // shifted toward LSL
        stdDev: 2,
      });

      // Cpu = (110 - 92) / (3 * 2) = 18 / 6 = 3.0
      expect(result.cpu).toBeCloseTo(3.0, 2);
      // Cpl = (92 - 90) / (3 * 2) = 2 / 6 = 0.333
      expect(result.cpl).toBeCloseTo(0.333, 2);
      // Cpk = min(3.0, 0.333) = 0.333
      expect(result.cpk).toBeCloseTo(0.333, 2);
    });
  });

  describe('Six Sigma benchmarks', () => {
    it('should indicate capable process (Cpk >= 1.33)', () => {
      const result = cpk({
        usl: 100,
        lsl: 80,
        mean: 90,
        stdDev: 2.5,
      });

      // Cpk = min(Cpu, Cpl) = min(4/7.5, 4/7.5) = 1.33
      expect(result.cpk).toBeGreaterThanOrEqual(1.33);
    });

    it('should indicate marginal process (1.0 <= Cpk < 1.33)', () => {
      const result = cpk({
        usl: 106,
        lsl: 94,
        mean: 100,
        stdDev: 2,
      });

      // Cpk = (106-100)/(3*2) = 6/6 = 1.0
      expect(result.cpk).toBeCloseTo(1.0, 2);
      expect(result.cpk).toBeGreaterThanOrEqual(1.0);
      expect(result.cpk).toBeLessThan(1.33);
    });

    it('should indicate incapable process (Cpk < 1.0)', () => {
      const result = cpk({
        usl: 104,
        lsl: 96,
        mean: 100,
        stdDev: 2,
      });

      // Cpk = (104-100)/(3*2) = 4/6 = 0.667
      expect(result.cpk).toBeCloseTo(0.667, 2);
      expect(result.cpk).toBeLessThan(1.0);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero standard deviation', () => {
      const result = cpk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 0,
      });

      expect(result.cp).toBe(0);
      expect(result.cpk).toBe(0);
      expect(result.cpu).toBe(0);
      expect(result.cpl).toBe(0);
      expect(result.sigmaLevel).toBe(0);
    });

    it('should return zeros for negative standard deviation', () => {
      const result = cpk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: -1,
      });

      expect(result.cpk).toBe(0);
    });

    it('should handle mean outside specification limits', () => {
      const result = cpk({
        usl: 110,
        lsl: 90,
        mean: 115,  // mean > USL
        stdDev: 2,
      });

      // Cpu = (110 - 115) / (3 * 2) = -5/6 = -0.833
      expect(result.cpu).toBeLessThan(0);
      // Cpk should be negative
      expect(result.cpk).toBeLessThan(0);
    });

    it('should handle very small standard deviation (high capability)', () => {
      const result = cpk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 0.5,
      });

      // Cp = 20 / (6 * 0.5) = 20 / 3 = 6.67
      expect(result.cp).toBeCloseTo(6.67, 1);
      // Very high sigma level
      expect(result.sigmaLevel).toBeGreaterThan(10);
    });
  });

  describe('Cp vs Cpk relationship', () => {
    it('should have Cp = Cpk when process is perfectly centered', () => {
      const result = cpk({
        usl: 110,
        lsl: 90,
        mean: 100,
        stdDev: 3,
      });

      expect(result.cp).toBeCloseTo(result.cpk, 4);
    });

    it('should have Cp > Cpk when process is off-center', () => {
      const result = cpk({
        usl: 110,
        lsl: 90,
        mean: 103,  // off-center
        stdDev: 3,
      });

      expect(result.cp).toBeGreaterThan(result.cpk);
    });
  });

  describe('Golden Reference Tests', () => {
    it('Six Sigma process: Cpk = 2.0 (centered, σ = specWidth/12)', () => {
      // Montgomery 7th Ed: For Cpk=2.0, need 6σ on each side of mean
      // specWidth = USL - LSL = 120, σ = 120/12 = 10, mean = centered at 60
      const result = cpk({
        usl: 120,
        lsl: 0,
        mean: 60,
        stdDev: 10,
      });

      // Cp = 120 / (6 × 10) = 2.0
      expect(result.cp).toBeCloseTo(2.0, 4);
      // Centered → Cpk = Cp = 2.0
      expect(result.cpk).toBeCloseTo(2.0, 4);
      // Sigma level = 3 × 2.0 = 6.0
      expect(result.sigmaLevel).toBeCloseTo(6.0, 4);
    });

    it('Minimum capable: Cpk ≈ 1.33 (centered, σ = specWidth/8)', () => {
      // ISO 22514-2: Cpk ≥ 1.33 is generally considered capable
      // specWidth = 80, σ = 80/8 = 10, mean = 50
      const result = cpk({
        usl: 90,
        lsl: 10,
        mean: 50,
        stdDev: 10,
      });

      // Cp = 80 / (6 × 10) = 1.333...
      expect(result.cp).toBeCloseTo(1.333, 2);
      expect(result.cpk).toBeCloseTo(1.333, 2);
      // Sigma level = 3 × 1.333 = 4.0
      expect(result.sigmaLevel).toBeCloseTo(4.0, 1);
    });

    it('Off-center process: Cpk < Cp demonstrates centering effect', () => {
      // Same spec & stdDev as above, but mean shifted by 1σ
      // specWidth = 80, σ = 10, mean = 60 (shifted 1σ from center)
      const result = cpk({
        usl: 90,
        lsl: 10,
        mean: 60,
        stdDev: 10,
      });

      // Cp = 80 / 60 = 1.333 (unchanged — Cp ignores centering)
      expect(result.cp).toBeCloseTo(1.333, 2);
      // Cpu = (90 - 60) / 30 = 1.0
      expect(result.cpu).toBeCloseTo(1.0, 4);
      // Cpl = (60 - 10) / 30 = 1.667
      expect(result.cpl).toBeCloseTo(1.667, 2);
      // Cpk = min(1.0, 1.667) = 1.0
      expect(result.cpk).toBeCloseTo(1.0, 4);
      // Cpk < Cp confirms off-center penalty
      expect(result.cpk).toBeLessThan(result.cp);
    });
  });
});
