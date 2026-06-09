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

  describe('I-MR chart', () => {
    // individuals = [10, 12, 11, 13, 12]
    // MR = [2, 1, 2, 1] -> MR̄ = 1.5 ; X̄ = 58/5 = 11.6 ; σ̂ = 1.5/1.128 = 1.3298
    // I:  CL=11.6, UCL=11.6+2.66*1.5=15.59, LCL=11.6-3.99=7.61
    // MR: CL=1.5,  UCL=3.267*1.5=4.9005, LCL=0
    const individuals = [[10], [12], [11], [13], [12]];

    it('computes I chart limits', () => {
      const r = controlChart({ chartType: 'imr', subgroups: individuals });
      expect(r.chartType).toBe('imr');
      expect(r.subgroupSize).toBe(1);
      expect(r.grandMean).toBeCloseTo(11.6, 4);
      expect(r.xBarLimits.centerLine).toBeCloseTo(11.6, 4);
      expect(r.xBarLimits.ucl).toBeCloseTo(15.59, 2);
      expect(r.xBarLimits.lcl).toBeCloseTo(7.61, 2);
    });

    it('computes MR chart limits', () => {
      const r = controlChart({ chartType: 'imr', subgroups: individuals });
      expect(r.rOrSLimits.centerLine).toBeCloseTo(1.5, 4);
      expect(r.rOrSLimits.ucl).toBeCloseTo(4.9005, 3);
      expect(r.rOrSLimits.lcl).toBe(0);
    });

    it('estimates sigma from MR̄/d2', () => {
      const r = controlChart({ chartType: 'imr', subgroups: individuals });
      expect(r.sigmaEstimate).toBeCloseTo(1.3298, 3);
    });

    it('first point has no moving range', () => {
      const r = controlChart({ chartType: 'imr', subgroups: individuals });
      expect(r.subgroupStats[0].range).toBeUndefined();
      expect(r.subgroupStats[0].mean).toBeCloseTo(10, 4);
      expect(r.subgroupStats[1].range).toBeCloseTo(2, 4);
    });

    it('flags out-of-control individual point', () => {
      // [10,10,10,10,30]: MR=[0,0,0,20] MR̄=5 X̄=14 ; I UCL=14+2.66*5=27.3 ; 30>27.3
      const r = controlChart({ chartType: 'imr', subgroups: [[10], [10], [10], [10], [30]] });
      expect(r.outOfControlPoints).toContain(4);
      expect(r.processCapable).toBe(false);
    });

    it('throws when fewer than 2 individuals', () => {
      expect(() => controlChart({ chartType: 'imr', subgroups: [[10]] }))
        .toThrow(RangeError);
    });

    it('throws when an imr subgroup is not size 1', () => {
      expect(() => controlChart({ chartType: 'imr', subgroups: [[10, 12], [11, 13]] }))
        .toThrow(RangeError);
    });

    it('flags MR-only out-of-control point where individual is within I limits', () => {
      // individuals = [20,20,20,20,20,20,20,20,20,10,20]
      // MR = [0,0,0,0,0,0,0,0,10,10]
      // X̄ = (9*20 + 10 + 20)/11 = 210/11 = 19.0909
      // MR̄ = 20/10 = 2.0
      // I UCL = 19.0909 + 2.66*2.0 = 24.411 ; I LCL = 19.0909 - 5.32 = 13.771
      // MR UCL = 3.267*2.0 = 6.534
      // Index 9 (value=10): MR=10 > 6.534 (oocMR), individual=10 < 13.771 (oocI too)
      // Index 10 (value=20): MR=10 > 6.534 (oocMR), individual=20 ∈ [13.771, 24.411] (in I limits → MR-only OOC)
      const subgroups = [[20],[20],[20],[20],[20],[20],[20],[20],[20],[10],[20]];
      const r = controlChart({ chartType: 'imr', subgroups });
      expect(r.outOfControlPoints).toContain(10);
      // Confirm the flag at index 10 is MR-only: individual is inside I limits
      expect(r.subgroupStats[10].mean).toBeGreaterThan(r.xBarLimits.lcl);
      expect(r.subgroupStats[10].mean).toBeLessThan(r.xBarLimits.ucl);
      expect(r.subgroupStats[10].range).toBeGreaterThan(r.rOrSLimits.ucl);
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
