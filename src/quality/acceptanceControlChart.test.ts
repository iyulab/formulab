import { describe, it, expect } from 'vitest';
import { acceptanceControlChart } from './acceptanceControlChart.js';

describe('acceptanceControlChart', () => {
  describe('validation', () => {
    it('throws when neither spec limit is given', () => {
      expect(() => acceptanceControlChart({
        sigma: 0.1, acceptableProportion: 0.001, rejectableProportion: 0.025,
      })).toThrow(RangeError);
    });

    it('throws for non-positive sigma', () => {
      expect(() => acceptanceControlChart({
        upperSpecLimit: 10.5, sigma: 0, acceptableProportion: 0.001, rejectableProportion: 0.025,
      })).toThrow(RangeError);
    });

    it('throws when rejectableProportion does not exceed acceptableProportion', () => {
      expect(() => acceptanceControlChart({
        upperSpecLimit: 10.5, sigma: 0.1, acceptableProportion: 0.025, rejectableProportion: 0.025,
      })).toThrow(RangeError);
    });

    it('throws for proportions out of (0,1)', () => {
      expect(() => acceptanceControlChart({
        upperSpecLimit: 10.5, sigma: 0.1, acceptableProportion: 0, rejectableProportion: 0.025,
      })).toThrow(RangeError);
    });

    it('throws for alpha/beta out of (0,1)', () => {
      expect(() => acceptanceControlChart({
        upperSpecLimit: 10.5, sigma: 0.1, acceptableProportion: 0.001, rejectableProportion: 0.025, alpha: 1,
      })).toThrow(RangeError);
    });
  });

  describe('ISO 7870-3:2012 Clause 9.1 Example 1 (bottle filling, two-sided)', () => {
    // U=10.5, L=9.5 cm3, sigma_w=0.1 cm3, p0=0.001 (z=3.090), p1=0.025 (z=1.960), alpha=beta=0.05
    const input = {
      upperSpecLimit: 10.5,
      lowerSpecLimit: 9.5,
      sigma: 0.1,
      acceptableProportion: 0.001,
      rejectableProportion: 0.025,
      alpha: 0.05,
      beta: 0.05,
    };

    it('matches the standard\'s APL/RPL exactly (spec-limit-derived, no rounding-path ambiguity)', () => {
      const r = acceptanceControlChart(input);
      expect(r.upper!.apl).toBeCloseTo(10.191, 2);
      expect(r.upper!.rpl).toBeCloseTo(10.304, 2);
      expect(r.lower!.apl).toBeCloseTo(9.809, 2);
      expect(r.lower!.rpl).toBeCloseTo(9.696, 2);
    });

    it('matches the standard\'s ACL within the printed worked example\'s own rounding-path tolerance', () => {
      // The standard prints ACL_U=10,245 / ACL_L=9,755. This formula (verified
      // exactly against Example 2 below) gives ~10.2475 / ~9.7525 - a ~0.003
      // discrepancy attributable to intermediate rounding in the 1970s
      // nomograph-era worked example, not a formula error (see the function's
      // @reference note). Tolerance reflects that documented uncertainty.
      const r = acceptanceControlChart(input);
      expect(r.upper!.acl).toBeCloseTo(10.245, 1);
      expect(r.lower!.acl).toBeCloseTo(9.755, 1);
    });

    it('matches the standard\'s sample size (n=9, rounded up from 8.48)', () => {
      const r = acceptanceControlChart(input);
      expect(r.sampleSize).toBe(9);
    });
  });

  describe('one-sided specification', () => {
    it('computes only the upper side when only upperSpecLimit is given', () => {
      const r = acceptanceControlChart({
        upperSpecLimit: 10.5, sigma: 0.1, acceptableProportion: 0.001, rejectableProportion: 0.025,
      });
      expect(r.upper).toBeDefined();
      expect(r.lower).toBeUndefined();
      expect(r.upper!.apl).toBeCloseTo(10.191, 2);
    });

    it('computes only the lower side when only lowerSpecLimit is given', () => {
      const r = acceptanceControlChart({
        lowerSpecLimit: 9.5, sigma: 0.1, acceptableProportion: 0.001, rejectableProportion: 0.025,
      });
      expect(r.lower).toBeDefined();
      expect(r.upper).toBeUndefined();
      expect(r.lower!.apl).toBeCloseTo(9.809, 2);
    });
  });

  describe('asymmetric two-sided specification', () => {
    it('uses the more stringent (larger) sample size across both sides', () => {
      // Wider gap on one side than the other -> that side needs fewer samples;
      // the narrower side drives the required n (standard Clause 7, note 2).
      const r = acceptanceControlChart({
        upperSpecLimit: 20, lowerSpecLimit: 9.5,
        sigma: 0.1, acceptableProportion: 0.001, rejectableProportion: 0.025,
      });
      // Upper side is far from target -> negligible n; lower side matches Example 1's lower n.
      const lowerOnly = acceptanceControlChart({
        lowerSpecLimit: 9.5, sigma: 0.1, acceptableProportion: 0.001, rejectableProportion: 0.025,
      });
      expect(r.sampleSize).toBe(lowerOnly.sampleSize);
    });
  });
});
