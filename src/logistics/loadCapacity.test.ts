import { describe, it, expect } from 'vitest';
import { loadCapacity } from './loadCapacity.js';

describe('loadCapacity', () => {
  describe('basic capacity derating', () => {
    it('should calculate effective capacity at rated load center', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 500,
        actualLoadCenter: 500,
      });

      // No derating: 2500 × (500/500) = 2500
      expect(result.effectiveCapacity).toBe(2500);
      expect(result.loadCenterDerating).toBe(0);
    });

    it('should derate capacity for extended load center', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 500,
        actualLoadCenter: 750,
      });

      // effective = 2500 × (500/750) = 1666.67
      expect(result.effectiveCapacity).toBeCloseTo(1666.67, 1);

      // derating = (2500 - 1666.67) / 2500 × 100 = 33.33%
      expect(result.loadCenterDerating).toBeCloseTo(33.33, 1);
    });

    it('caps capacity at the rated capacity for a shorter load center, and says so', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 600,
        actualLoadCenter: 400,
      });

      // The moment arithmetic gives 2500 × (600/400) = 3750, but the data plate capacity is a
      // maximum: a shorter load center does not make the truck (mast, tyres, hydraulics) rated
      // for more than its nameplate load.
      expect(result.effectiveCapacity).toBe(2500);
      expect(result.capacityCappedAtRated).toBe(true);
      expect(result.loadCenterDerating).toBe(0);
      expect(result.loadCenterLoss).toBe(0);
    });

    it('does not flag the cap at or beyond the rated load center', () => {
      expect(loadCapacity({ ratedCapacity: 2500, ratedLoadCenter: 600, actualLoadCenter: 600 }).capacityCappedAtRated).toBe(false);
      expect(loadCapacity({ ratedCapacity: 2500, ratedLoadCenter: 600, actualLoadCenter: 601 }).capacityCappedAtRated).toBe(false);
    });
  });

  describe('attachment weight loss', () => {
    it('should subtract attachment weight loss', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 500,
        actualLoadCenter: 500,
        attachmentWeightLoss: 200,
      });

      // netCapacity = 2500 - 200 = 2300
      expect(result.netCapacity).toBe(2300);
    });

    it('should not go below zero net capacity', () => {
      const result = loadCapacity({
        ratedCapacity: 1000,
        ratedLoadCenter: 500,
        actualLoadCenter: 1000,
        attachmentWeightLoss: 600,
      });

      // effective = 1000 × (500/1000) = 500
      // net = max(0, 500 - 600) = 0
      expect(result.netCapacity).toBe(0);
      expect(result.netCapacityClamped).toBe(true);
    });

    it('does not flag the net capacity when the attachment leaves some capacity', () => {
      const result = loadCapacity({ ratedCapacity: 1000, ratedLoadCenter: 500, actualLoadCenter: 1000, attachmentWeightLoss: 500 });
      expect(result.netCapacity).toBe(0);
      expect(result.netCapacityClamped).toBe(false);
    });
  });

  describe('utilization calculation', () => {
    it('should calculate utilization when actual load provided', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 500,
        actualLoadCenter: 500,
        actualLoad: 2000,
      });

      // utilization = 2000 / 2500 × 100 = 80%
      expect(result.utilization).toBe(80);
      expect(result.isOverloaded).toBe(false);
      expect(result.safetyMargin).toBe(500);
    });

    it('should detect overloaded condition', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 500,
        actualLoadCenter: 750,
        actualLoad: 2000,
      });

      // effective = 1666.67, net = 1666.67
      // 2000 > 1666.67 → overloaded
      expect(result.isOverloaded).toBe(true);
      expect(result.safetyMargin).toBeLessThan(0);
      expect(result.utilization).toBeGreaterThan(100);
    });

    it('should return null metrics when actual load not provided', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 500,
        actualLoadCenter: 600,
      });

      expect(result.utilization).toBeNull();
      expect(result.isOverloaded).toBeNull();
      expect(result.safetyMargin).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero rated capacity', () => {
      const result = loadCapacity({
        ratedCapacity: 0,
        ratedLoadCenter: 500,
        actualLoadCenter: 500,
      });

      expect(result.effectiveCapacity).toBe(0);
    });

    it('should return zeros for zero rated load center', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 0,
        actualLoadCenter: 500,
      });

      expect(result.effectiveCapacity).toBe(0);
    });

    it('should return zeros for zero actual load center', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 500,
        actualLoadCenter: 0,
      });

      expect(result.effectiveCapacity).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate 3-ton forklift with side-shift', () => {
      const result = loadCapacity({
        ratedCapacity: 3000,
        ratedLoadCenter: 500,
        actualLoadCenter: 600,
        actualLoad: 2200,
        attachmentWeightLoss: 150,
      });

      // effective = 3000 × (500/600) = 2500
      // net = 2500 - 150 = 2350
      // utilization = 2200 / 2350 × 100 = 93.62%
      expect(result.effectiveCapacity).toBe(2500);
      expect(result.netCapacity).toBe(2350);
      expect(result.utilization).toBeCloseTo(93.62, 1);
      expect(result.isOverloaded).toBe(false);
    });

    it('should calculate heavy forklift with long load', () => {
      const result = loadCapacity({
        ratedCapacity: 5000,
        ratedLoadCenter: 600,
        actualLoadCenter: 900,
        actualLoad: 3000,
        attachmentWeightLoss: 300,
      });

      // effective = 5000 × (600/900) = 3333.33
      // net = 3333.33 - 300 = 3033.33
      expect(result.isOverloaded).toBe(false);
      expect(result.safetyMargin).toBeCloseTo(33.33, 1);
    });
  });

  describe('capacity parts', () => {
    it('returns rated capacity, load-center loss and attachment loss that add back to the net capacity', () => {
      const r = loadCapacity({ ratedCapacity: 3000, ratedLoadCenter: 500, actualLoadCenter: 600, attachmentWeightLoss: 150 });
      expect(r.ratedCapacity).toBe(3000);
      expect(r.attachmentWeightLoss).toBe(150);
      expect(r.loadCenterLoss).toBeCloseTo(500, 4);
      expect(r.ratedCapacity - r.loadCenterLoss - r.attachmentWeightLoss).toBeCloseTo(r.netCapacity, 4);
    });

    it('reports an omitted attachment as zero loss', () => {
      expect(loadCapacity({ ratedCapacity: 3000, ratedLoadCenter: 500, actualLoadCenter: 600 }).attachmentWeightLoss).toBe(0);
    });
  });

  describe('input validation — loads', () => {
    it.each([
      ['attachmentWeightLoss is negative', { attachmentWeightLoss: -1 }],
      ['actualLoad is negative', { actualLoad: -1 }],
    ])('throws RangeError when %s', (_label, override) => {
      expect(() => loadCapacity({ ratedCapacity: 3000, ratedLoadCenter: 500, actualLoadCenter: 600, ...override })).toThrow(RangeError);
    });
  });
});
