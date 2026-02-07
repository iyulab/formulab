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

    it('should increase capacity for shorter load center', () => {
      const result = loadCapacity({
        ratedCapacity: 2500,
        ratedLoadCenter: 600,
        actualLoadCenter: 400,
      });

      // effective = 2500 × (600/400) = 3750
      expect(result.effectiveCapacity).toBe(3750);
      // derating is negative (capacity increased)
      expect(result.loadCenterDerating).toBeLessThan(0);
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
});
