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
});
