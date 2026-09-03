import { describe, it, expect } from 'vitest';
import { movingAverageRangeChart } from './movingAverageRangeChart.js';

describe('movingAverageRangeChart', () => {
  describe('validation', () => {
    it('throws when windowSize < 2', () => {
      expect(() => movingAverageRangeChart({ values: [1, 2, 3, 4], windowSize: 1 }))
        .toThrow(RangeError);
    });

    it('throws when windowSize > 25', () => {
      const values = Array.from({ length: 27 }, (_, i) => i);
      expect(() => movingAverageRangeChart({ values, windowSize: 26 }))
        .toThrow(RangeError);
    });

    it('throws when fewer than windowSize + 1 values are given', () => {
      expect(() => movingAverageRangeChart({ values: [1, 2, 3], windowSize: 3 }))
        .toThrow(RangeError);
    });

    it('accepts exactly windowSize + 1 values', () => {
      const result = movingAverageRangeChart({ values: [1, 2, 3, 4], windowSize: 3 });
      expect(result.windowStats).toHaveLength(4);
    });
  });

  describe('basic mechanics', () => {
    it('leaves the first windowSize - 1 points without a moving average/range', () => {
      const result = movingAverageRangeChart({ values: [1, 2, 3, 4, 5], windowSize: 3 });
      expect(result.windowStats[0].movingAverage).toBeUndefined();
      expect(result.windowStats[0].movingRange).toBeUndefined();
      expect(result.windowStats[1].movingAverage).toBeUndefined();
      expect(result.windowStats[2].movingAverage).toBeDefined();
    });

    it('computes the moving average and moving range for a full window', () => {
      // window [1,2,3] -> mean=2, range=2
      const result = movingAverageRangeChart({ values: [1, 2, 3, 4, 5], windowSize: 3 });
      expect(result.windowStats[2].movingAverage).toBeCloseTo(2, 6);
      expect(result.windowStats[2].movingRange).toBeCloseTo(2, 6);
      // window [2,3,4] -> mean=3, range=2
      expect(result.windowStats[3].movingAverage).toBeCloseTo(3, 6);
      expect(result.windowStats[3].movingRange).toBeCloseTo(2, 6);
    });
  });

  describe('ISO 7870-5:2014 Clause 6.5 golden reference (watchcase crown pin hole diameter, k=3)', () => {
    // Table 1 raw hole-diameter values (mm), in production order - transcribed
    // directly from the standard, not from its printed moving-average/range
    // summary columns. All per-row moving average/range values below were
    // independently recomputed from these raw values and cross-checked cell-by-
    // cell against the standard's Table 1 before being used as golden numbers.
    const diameters = [
      0.003, 0.005, 0.001, 0.003, 0.002, 0.005, 0.006, 0.003, 0.004, 0.005,
      0.005, 0.006, 0.001, 0.002, 0.007, 0.001, 0.003, 0.004, 0.003, 0.001,
      0.006, 0.005, 0.004, 0.002, 0.001,
    ];

    it('matches the standard\'s per-row moving average and moving range (spot-checked rows)', () => {
      const result = movingAverageRangeChart({ values: diameters, windowSize: 3 });

      // Row 3 (index 2): sum=0.009 -> MA=0.0030, MR=0.004
      expect(result.windowStats[2].movingAverage).toBeCloseTo(0.0030, 6);
      expect(result.windowStats[2].movingRange).toBeCloseTo(0.004, 6);
      // Row 12 (index 11): sum=0.016 -> MA=0.0053, MR=0.001
      expect(result.windowStats[11].movingAverage).toBeCloseTo(0.0053, 4);
      expect(result.windowStats[11].movingRange).toBeCloseTo(0.001, 6);
      // Row 15 (index 14): sum=0.010 -> MA=0.0033, MR=0.006
      expect(result.windowStats[14].movingAverage).toBeCloseTo(0.0033, 4);
      expect(result.windowStats[14].movingRange).toBeCloseTo(0.006, 6);
      // Row 25 (index 24): sum=0.007 -> MA=0.0023, MR=0.003
      expect(result.windowStats[24].movingAverage).toBeCloseTo(0.0023, 4);
      expect(result.windowStats[24].movingRange).toBeCloseTo(0.003, 6);
    });

    it('matches the standard\'s moving range chart limits (R̄=0.0035, UCL=0.0090, LCL=0)', () => {
      const result = movingAverageRangeChart({ values: diameters, windowSize: 3 });
      expect(result.mrLimits.centerLine).toBeCloseTo(0.0035, 4);
      expect(result.mrLimits.ucl).toBeCloseTo(0.0090, 4);
      expect(result.mrLimits.lcl).toBe(0);
    });

    it('matches the standard\'s moving average chart center line and UCL (x̄=0.0036, UCL=0.0072)', () => {
      const result = movingAverageRangeChart({ values: diameters, windowSize: 3 });
      expect(result.grandAverage).toBeCloseTo(0.0036, 4);
      expect(result.maLimits.centerLine).toBeCloseTo(0.0036, 4);
      expect(result.maLimits.ucl).toBeCloseTo(0.0072, 4);
      // LCL: independently recomputed as x̄ - A2·R̄ = 0.003609 - 1.023×0.003478 ≈
      // 0.0000504, which rounds to 0.0001 (not the ~0 the standard's garbled OCR
      // summary line suggests - recomputed from Table 1 per the CLAUDE.md
      // "transcribe from the raw table, not the summary line" discipline).
      expect(result.maLimits.lcl).toBeCloseTo(0.0001, 4);
    });

    it('reports a stable, in-control process (all points within limits, matching the standard\'s Figure 1)', () => {
      const result = movingAverageRangeChart({ values: diameters, windowSize: 3 });
      expect(result.outOfControlPoints).toHaveLength(0);
      expect(result.processCapable).toBe(true);
    });

    it('uses the X-bar/R Annex A factors for n=3 (A2=1.023, D3=0, D4=2.575)', () => {
      const result = movingAverageRangeChart({ values: diameters, windowSize: 3 });
      const rBar = result.mrLimits.centerLine;
      const expectedUclMa = result.grandAverage + 1.023 * rBar;
      expect(result.maLimits.ucl).toBeCloseTo(expectedUclMa, 3);
    });
  });

  describe('out-of-control detection', () => {
    it('flags a moving-average point outside the control limits', () => {
      const values = [10, 10.1, 9.9, 10, 10.1, 9.9, 10, 10.1, 9.9, 10, 50, 50, 50];
      const result = movingAverageRangeChart({ values, windowSize: 3 });
      expect(result.outOfControlPoints.length).toBeGreaterThan(0);
      expect(result.processCapable).toBe(false);
    });
  });
});
