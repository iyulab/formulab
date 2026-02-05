import { describe, it, expect } from 'vitest';
import { dpmo } from './dpmo.js';

describe('dpmo', () => {
  describe('basic calculations', () => {
    it('should calculate DPMO for given defects', () => {
      const result = dpmo({
        defects: 10,
        units: 1000,
        opportunities: 5,  // 5 defect opportunities per unit
      });

      // DPMO = (10 / (1000 * 5)) * 1,000,000 = 2000
      expect(result.dpmo).toBe(2000);
      // DPU = 10 / 1000 = 0.01
      expect(result.dpu).toBe(0.01);
      // Defect rate = (10 / 5000) * 100 = 0.2%
      expect(result.defectRate).toBe(0.2);
      // Yield = (1 - 2000/1000000) * 100 = 99.8%
      expect(result.yield).toBe(99.8);
    });

    it('should calculate correct sigma level', () => {
      // 3.4 DPMO = 6 sigma (with 1.5 shift)
      const result = dpmo({
        defects: 34,
        units: 10000000,
        opportunities: 1,
      });

      // DPMO ≈ 3.4
      expect(result.dpmo).toBeCloseTo(3.4, 1);
      // Sigma level should be close to 6
      expect(result.sigmaLevel).toBeGreaterThan(5.5);
    });
  });

  describe('Six Sigma benchmarks', () => {
    it('should calculate 3-sigma level (~66,800 DPMO)', () => {
      const result = dpmo({
        defects: 66800,
        units: 1000000,
        opportunities: 1,
      });

      expect(result.dpmo).toBe(66800);
      // 3-sigma with 1.5 shift
      expect(result.sigmaLevel).toBeCloseTo(3, 0.5);
    });

    it('should calculate 4-sigma level (~6,210 DPMO)', () => {
      const result = dpmo({
        defects: 6210,
        units: 1000000,
        opportunities: 1,
      });

      expect(result.dpmo).toBe(6210);
      expect(result.sigmaLevel).toBeCloseTo(4, 0.5);
    });

    it('should calculate 5-sigma level (~233 DPMO)', () => {
      const result = dpmo({
        defects: 233,
        units: 1000000,
        opportunities: 1,
      });

      expect(result.dpmo).toBe(233);
      expect(result.sigmaLevel).toBeCloseTo(5, 0.5);
    });
  });

  describe('perfect and worst case', () => {
    it('should handle zero defects (perfect process)', () => {
      const result = dpmo({
        defects: 0,
        units: 1000,
        opportunities: 10,
      });

      expect(result.dpmo).toBe(0);
      expect(result.sigmaLevel).toBe(6); // Max sigma level
      expect(result.yield).toBe(100);
      expect(result.dpu).toBe(0);
      expect(result.defectRate).toBe(0);
    });

    it('should handle all defective (worst case)', () => {
      const result = dpmo({
        defects: 10000,
        units: 1000,
        opportunities: 10,  // total opportunities = 10000
      });

      // DPMO = 1,000,000 (100% defect rate)
      expect(result.dpmo).toBe(1000000);
      expect(result.sigmaLevel).toBe(0);
      expect(result.yield).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero units', () => {
      const result = dpmo({
        defects: 10,
        units: 0,
        opportunities: 5,
      });

      expect(result.dpmo).toBe(0);
      expect(result.sigmaLevel).toBe(0);
      expect(result.yield).toBe(0);
      expect(result.dpu).toBe(0);
    });

    it('should return zeros for zero opportunities', () => {
      const result = dpmo({
        defects: 10,
        units: 1000,
        opportunities: 0,
      });

      expect(result.dpmo).toBe(0);
    });

    it('should return zeros for negative units', () => {
      const result = dpmo({
        defects: 10,
        units: -100,
        opportunities: 5,
      });

      expect(result.dpmo).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate DPMO for PCB assembly', () => {
      // 100 boards, each with 500 solder joints (opportunities)
      // Found 25 defects during inspection
      const result = dpmo({
        defects: 25,
        units: 100,
        opportunities: 500,
      });

      // DPMO = (25 / 50000) * 1,000,000 = 500
      expect(result.dpmo).toBe(500);
      expect(result.dpu).toBe(0.25); // 0.25 defects per board
    });
  });
});
