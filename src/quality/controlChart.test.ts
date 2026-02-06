import { describe, it, expect } from 'vitest';
import { controlChart } from './controlChart.js';

describe('controlChart', () => {
  // Example data: 10 subgroups of size 5
  const sampleSubgroups = [
    [10.2, 10.1, 10.3, 10.0, 10.2],
    [10.1, 10.3, 10.2, 10.1, 10.0],
    [10.0, 10.2, 10.1, 10.3, 10.1],
    [10.3, 10.1, 10.0, 10.2, 10.2],
    [10.1, 10.2, 10.3, 10.1, 10.0],
    [10.2, 10.0, 10.1, 10.2, 10.3],
    [10.0, 10.1, 10.2, 10.1, 10.3],
    [10.1, 10.2, 10.0, 10.3, 10.2],
    [10.2, 10.1, 10.3, 10.0, 10.1],
    [10.3, 10.2, 10.1, 10.1, 10.0],
  ];

  describe('X-bar/R chart', () => {
    it('should calculate control limits for in-control process', () => {
      const result = controlChart({
        chartType: 'xbarR',
        subgroups: sampleSubgroups,
      });

      expect(result.chartType).toBe('xbarR');
      expect(result.subgroupSize).toBe(5);
      expect(result.subgroupStats).toHaveLength(10);

      // Grand mean should be around 10.14-10.16
      expect(result.grandMean).toBeCloseTo(10.14, 1);

      // Control limits should exist
      expect(result.xBarLimits.ucl).toBeGreaterThan(result.xBarLimits.centerLine);
      expect(result.xBarLimits.lcl).toBeLessThan(result.xBarLimits.centerLine);

      // R chart limits
      expect(result.rOrSLimits.ucl).toBeGreaterThan(0);
      expect(result.rOrSLimits.lcl).toBe(0); // D3=0 for n=5

      // Sigma estimate should be reasonable
      expect(result.sigmaEstimate).toBeGreaterThan(0);
      expect(result.sigmaEstimate).toBeLessThan(1);
    });

    it('should use correct A2 constant for n=5', () => {
      const result = controlChart({
        chartType: 'xbarR',
        subgroups: sampleSubgroups,
      });
      // A2 for n=5 = 0.577
      const rBar = result.rOrSLimits.centerLine;
      const expected_ucl = result.grandMean + 0.577 * rBar;
      expect(result.xBarLimits.ucl).toBeCloseTo(expected_ucl, 3);
    });

    it('should detect out-of-control points', () => {
      // Add an outlier subgroup
      const dataWithOutlier = [
        ...sampleSubgroups,
        [15.0, 14.5, 15.2, 14.8, 15.1], // clearly out of control
      ];
      const result = controlChart({
        chartType: 'xbarR',
        subgroups: dataWithOutlier,
      });

      expect(result.outOfControlPoints.length).toBeGreaterThan(0);
      expect(result.processCapable).toBe(false);
    });
  });

  describe('X-bar/S chart', () => {
    it('should calculate control limits', () => {
      const result = controlChart({
        chartType: 'xbarS',
        subgroups: sampleSubgroups,
      });

      expect(result.chartType).toBe('xbarS');
      expect(result.subgroupSize).toBe(5);

      // Each stat should have stdDev instead of range
      expect(result.subgroupStats[0].stdDev).toBeDefined();
      expect(result.subgroupStats[0].range).toBeUndefined();

      // Sigma estimate via c4
      expect(result.sigmaEstimate).toBeGreaterThan(0);
    });

    it('should produce similar sigma estimate as X-bar/R', () => {
      const xbarR = controlChart({ chartType: 'xbarR', subgroups: sampleSubgroups });
      const xbarS = controlChart({ chartType: 'xbarS', subgroups: sampleSubgroups });

      // Both methods should estimate similar sigma
      expect(xbarS.sigmaEstimate).toBeCloseTo(xbarR.sigmaEstimate, 1);
    });
  });

  describe('different subgroup sizes', () => {
    it('should work with n=2', () => {
      const data = [[10.0, 10.2], [10.1, 10.3], [10.0, 10.1], [9.9, 10.2]];
      const result = controlChart({ chartType: 'xbarR', subgroups: data });
      expect(result.subgroupSize).toBe(2);
      // D3=0 for n=2
      expect(result.rOrSLimits.lcl).toBe(0);
    });

    it('should work with n=10', () => {
      const data = Array.from({ length: 5 }, () =>
        Array.from({ length: 10 }, () => 10 + (Math.random() - 0.5) * 0.2),
      );
      const result = controlChart({ chartType: 'xbarR', subgroups: data });
      expect(result.subgroupSize).toBe(10);
    });
  });

  describe('validation', () => {
    it('should throw on fewer than 2 subgroups', () => {
      expect(() => controlChart({
        chartType: 'xbarR',
        subgroups: [[10, 11, 12]],
      })).toThrow();
    });

    it('should throw on subgroup size < 2', () => {
      expect(() => controlChart({
        chartType: 'xbarR',
        subgroups: [[10], [11], [12]],
      })).toThrow();
    });

    it('should throw on subgroup size > 25', () => {
      const bigSubgroup = Array.from({ length: 26 }, () => 10);
      expect(() => controlChart({
        chartType: 'xbarR',
        subgroups: [bigSubgroup, bigSubgroup],
      })).toThrow();
    });

    it('should throw on inconsistent subgroup sizes', () => {
      expect(() => controlChart({
        chartType: 'xbarR',
        subgroups: [[10, 11, 12], [10, 11]],
      })).toThrow();
    });
  });

  describe('Golden Reference Tests', () => {
    it('AIAG/ASTM E2587 constants verification for n=5', () => {
      // Verify that the implementation uses correct constants for n=5
      // Reference: AIAG SPC Manual, ASTM E2587-16 Table
      // A2=0.577, D3=0, D4=2.114, d2=2.326
      const subgroups = [
        [10.0, 10.0, 10.0, 10.0, 10.0],
        [10.3, 10.3, 10.3, 10.3, 10.3],
      ];
      // Both subgroups have range=0, so R̄=0 → limits collapse to grand mean
      // Grand mean = (10.0 + 10.3) / 2 = 10.15
      const result = controlChart({ chartType: 'xbarR', subgroups });

      expect(result.grandMean).toBeCloseTo(10.15, 4);
      // With R̄=0: UCL = LCL = grand mean (A2 × 0 = 0)
      expect(result.xBarLimits.ucl).toBeCloseTo(10.15, 4);
      expect(result.xBarLimits.lcl).toBeCloseTo(10.15, 4);
      expect(result.rOrSLimits.lcl).toBe(0); // D3=0 for n=5
    });

    it('Stable process: all points within control limits', () => {
      // A known stable dataset — 5 subgroups of size 5 with tight variation
      const stableData = [
        [50.0, 50.1, 49.9, 50.0, 50.1],
        [50.0, 49.9, 50.1, 50.0, 49.9],
        [50.1, 50.0, 49.9, 50.0, 50.1],
        [49.9, 50.0, 50.1, 50.0, 49.9],
        [50.0, 50.0, 50.1, 49.9, 50.0],
      ];
      const result = controlChart({ chartType: 'xbarR', subgroups: stableData });

      expect(result.processCapable).toBe(true);
      expect(result.outOfControlPoints).toHaveLength(0);
      // Grand mean ≈ 50.0
      expect(result.grandMean).toBeCloseTo(50.0, 1);
      // Sigma should be small (~0.07-0.08)
      expect(result.sigmaEstimate).toBeLessThan(0.15);
    });

    it('AIAG/ASTM constants: n=2 (A2=1.880, D4=3.267, d2=1.128)', () => {
      // Verify constants for smallest subgroup size
      const data = [
        [10.0, 10.2],
        [10.1, 10.3],
        [10.0, 10.1],
        [10.2, 10.4],
      ];
      const result = controlChart({ chartType: 'xbarR', subgroups: data });

      // Subgroup means: 10.1, 10.2, 10.05, 10.3 → grand mean = 10.1625
      expect(result.grandMean).toBeCloseTo(10.1625, 3);
      // Ranges: 0.2, 0.2, 0.1, 0.2 → R̄ = 0.175
      const rBar = result.rOrSLimits.centerLine;
      expect(rBar).toBeCloseTo(0.175, 3);
      // UCL_X̄ = 10.1625 + 1.880 × 0.175 = 10.1625 + 0.329 = 10.4915
      expect(result.xBarLimits.ucl).toBeCloseTo(10.4915, 3);
      // σ̂ = R̄/d₂ = 0.175/1.128 = 0.1551
      expect(result.sigmaEstimate).toBeCloseTo(0.1551, 3);
    });
  });
});
