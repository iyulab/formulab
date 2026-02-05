import { describe, it, expect } from 'vitest';
import { fillRate, serviceLevel } from './fillRate.js';

describe('fillRate', () => {
  describe('basic calculations', () => {
    it('should calculate 100% fill rate for complete fulfillment', () => {
      const result = fillRate({
        totalOrders: 100,
        filledComplete: 100,
      });

      expect(result.fillRate).toBe(100);
      expect(result.shortfallRate).toBe(0);
      expect(result.shortfall).toBe(0);
    });

    it('should calculate partial fill rate', () => {
      const result = fillRate({
        totalOrders: 100,
        filledComplete: 85,
      });

      expect(result.fillRate).toBe(85);
      expect(result.shortfallRate).toBe(15);
      expect(result.shortfall).toBe(15);
    });

    it('should calculate 0% fill rate for no fulfillment', () => {
      const result = fillRate({
        totalOrders: 100,
        filledComplete: 0,
      });

      expect(result.fillRate).toBe(0);
      expect(result.shortfallRate).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should handle zero total orders', () => {
      const result = fillRate({
        totalOrders: 0,
        filledComplete: 0,
      });

      expect(result.fillRate).toBe(0);
      expect(result.shortfallRate).toBe(100);
    });

    it('should clamp filled to total orders', () => {
      const result = fillRate({
        totalOrders: 100,
        filledComplete: 150, // More than total
      });

      expect(result.fillRate).toBe(100);
      expect(result.filledComplete).toBe(100);
    });

    it('should clamp negative filled to zero', () => {
      const result = fillRate({
        totalOrders: 100,
        filledComplete: -10,
      });

      expect(result.fillRate).toBe(0);
      expect(result.filledComplete).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate warehouse fulfillment rate', () => {
      const result = fillRate({
        totalOrders: 1500,
        filledComplete: 1425,
      });

      expect(result.fillRate).toBe(95);
    });

    it('should calculate e-commerce fill rate', () => {
      const result = fillRate({
        totalOrders: 5000,
        filledComplete: 4750,
      });

      expect(result.fillRate).toBe(95);
      expect(result.shortfall).toBe(250);
    });
  });
});

describe('serviceLevel', () => {
  describe('basic calculations', () => {
    it('should calculate service level from safety stock', () => {
      const result = serviceLevel({
        demandStdDev: 100,
        safetyStock: 165, // ~1.65 sigma
      });

      // 1.65 sigma ≈ 95% service level
      expect(result.serviceLevel).toBeCloseTo(95, 0);
      expect(result.stockoutProbability).toBeCloseTo(5, 0);
    });

    it('should calculate z-score', () => {
      const result = serviceLevel({
        demandStdDev: 100,
        safetyStock: 200,
      });

      expect(result.zScore).toBe(2);
    });

    it('should return 50% for zero safety stock', () => {
      const result = serviceLevel({
        demandStdDev: 100,
        safetyStock: 0,
      });

      expect(result.serviceLevel).toBe(50);
      expect(result.stockoutProbability).toBe(50);
    });
  });

  describe('service level targets', () => {
    it('should calculate 90% service level', () => {
      const result = serviceLevel({
        demandStdDev: 100,
        safetyStock: 128, // ~1.28 sigma
      });

      expect(result.serviceLevel).toBeCloseTo(90, 0);
    });

    it('should calculate 99% service level', () => {
      const result = serviceLevel({
        demandStdDev: 100,
        safetyStock: 233, // ~2.33 sigma
      });

      expect(result.serviceLevel).toBeCloseTo(99, 0);
    });
  });

  describe('edge cases', () => {
    it('should handle zero standard deviation', () => {
      const result = serviceLevel({
        demandStdDev: 0,
        safetyStock: 100,
      });

      expect(result.serviceLevel).toBe(100);
    });

    it('should handle negative safety stock', () => {
      const result = serviceLevel({
        demandStdDev: 100,
        safetyStock: -100,
      });

      expect(result.serviceLevel).toBeLessThan(50);
    });
  });
});
