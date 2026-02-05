import { describe, it, expect } from 'vitest';
import { concentration } from './concentration.js';

describe('concentration', () => {
  describe('conversion from mol/L', () => {
    it('should convert mol/L to wt% correctly', () => {
      const result = concentration({
        fromUnit: 'molPerL',
        value: 1,
        molecularWeight: 58.44, // NaCl
        solutionDensity: 1.04,
      });

      // wt% = (mol/L * MW) / (density * 10) = (1 * 58.44) / (1.04 * 10) = 5.62%
      expect(result.wtPercent).toBeCloseTo(5.62, 1);
    });

    it('should convert mol/L to ppm correctly', () => {
      const result = concentration({
        fromUnit: 'molPerL',
        value: 0.001,
        molecularWeight: 58.44, // NaCl
        solutionDensity: 1.0,
      });

      // wt% = (0.001 * 58.44) / 10 = 0.005844
      // ppm = wt% * 10000 = 58.44
      expect(result.ppm).toBeCloseTo(58.44, 1);
    });

    it('should preserve mol/L value', () => {
      const result = concentration({
        fromUnit: 'molPerL',
        value: 2.5,
        molecularWeight: 40,
        solutionDensity: 1.2,
      });

      expect(result.molPerL).toBe(2.5);
    });
  });

  describe('conversion from wt%', () => {
    it('should convert wt% to mol/L correctly', () => {
      const result = concentration({
        fromUnit: 'wtPercent',
        value: 10, // 10 wt%
        molecularWeight: 98.08, // H2SO4
        solutionDensity: 1.07,
      });

      // mol/L = (wt% * density * 1000) / (MW * 100)
      // = (10 * 1.07 * 1000) / (98.08 * 100) = 1.09
      expect(result.molPerL).toBeCloseTo(1.09, 1);
    });

    it('should convert wt% to ppm correctly', () => {
      const result = concentration({
        fromUnit: 'wtPercent',
        value: 0.5,
        molecularWeight: 100,
        solutionDensity: 1.0,
      });

      // ppm = wt% * 10000 = 0.5 * 10000 = 5000
      expect(result.ppm).toBe(5000);
    });

    it('should preserve wt% value', () => {
      const result = concentration({
        fromUnit: 'wtPercent',
        value: 15,
        molecularWeight: 50,
        solutionDensity: 1.1,
      });

      expect(result.wtPercent).toBe(15);
    });
  });

  describe('conversion from ppm', () => {
    it('should convert ppm to wt% correctly', () => {
      const result = concentration({
        fromUnit: 'ppm',
        value: 10000,
        molecularWeight: 100,
        solutionDensity: 1.0,
      });

      // wt% = ppm / 10000 = 10000 / 10000 = 1%
      expect(result.wtPercent).toBe(1);
    });

    it('should convert ppm to mol/L correctly', () => {
      const result = concentration({
        fromUnit: 'ppm',
        value: 1000,
        molecularWeight: 100,
        solutionDensity: 1.0,
      });

      // mol/L = (ppm * density) / (MW * 1000)
      // = (1000 * 1.0) / (100 * 1000) = 0.01
      expect(result.molPerL).toBe(0.01);
    });

    it('should preserve ppm value', () => {
      const result = concentration({
        fromUnit: 'ppm',
        value: 500,
        molecularWeight: 50,
        solutionDensity: 1.0,
      });

      expect(result.ppm).toBe(500);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for unknown unit', () => {
      const result = concentration({
        fromUnit: 'unknown' as never,
        value: 1,
        molecularWeight: 100,
        solutionDensity: 1.0,
      });

      expect(result.molPerL).toBe(0);
      expect(result.wtPercent).toBe(0);
      expect(result.ppm).toBe(0);
    });

    it('should handle very small concentrations', () => {
      const result = concentration({
        fromUnit: 'ppm',
        value: 1,
        molecularWeight: 100,
        solutionDensity: 1.0,
      });

      expect(result.wtPercent).toBe(0.0001);
      expect(result.molPerL).toBe(0.00001);
    });

    it('should handle high density solutions', () => {
      const result = concentration({
        fromUnit: 'wtPercent',
        value: 50,
        molecularWeight: 98.08,
        solutionDensity: 1.4, // Concentrated H2SO4
      });

      expect(result.molPerL).toBeCloseTo(7.14, 1);
    });
  });

  describe('real-world scenarios', () => {
    it('should convert sodium chloride solution', () => {
      // 0.9% NaCl (physiological saline)
      const result = concentration({
        fromUnit: 'wtPercent',
        value: 0.9,
        molecularWeight: 58.44,
        solutionDensity: 1.005,
      });

      // mol/L = (0.9 * 1.005 * 1000) / (58.44 * 100) = 0.155
      expect(result.molPerL).toBeCloseTo(0.155, 2);
    });

    it('should convert glucose solution', () => {
      // 5% glucose (dextrose)
      const result = concentration({
        fromUnit: 'wtPercent',
        value: 5,
        molecularWeight: 180.16,
        solutionDensity: 1.02,
      });

      // mol/L = (5 * 1.02 * 1000) / (180.16 * 100) = 0.283
      expect(result.molPerL).toBeCloseTo(0.283, 2);
    });

    it('should convert trace metal concentration', () => {
      // 50 ppm copper
      const result = concentration({
        fromUnit: 'ppm',
        value: 50,
        molecularWeight: 63.55, // Cu
        solutionDensity: 1.0,
      });

      // mol/L = (50 * 1.0) / (63.55 * 1000) = 0.000787
      expect(result.molPerL).toBeCloseTo(0.000787, 5);
    });

    it('should convert hydrochloric acid', () => {
      // 1 M HCl
      const result = concentration({
        fromUnit: 'molPerL',
        value: 1,
        molecularWeight: 36.46,
        solutionDensity: 1.02,
      });

      // wt% = (1 * 36.46) / (1.02 * 10) = 3.57%
      expect(result.wtPercent).toBeCloseTo(3.57, 1);
    });
  });
});
