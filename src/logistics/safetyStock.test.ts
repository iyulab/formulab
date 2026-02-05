import { describe, it, expect } from 'vitest';
import { safetyStock } from './safetyStock.js';

describe('safetyStock', () => {
  describe('basic calculation', () => {
    it('should calculate safety stock for 95% service level', () => {
      const result = safetyStock({
        avgDemand: 100,        // 100 units/day
        demandStdDev: 20,      // σ_d = 20
        avgLeadTime: 5,        // 5 days
        leadTimeStdDev: 1,     // σ_L = 1 day
        serviceLevel: 0.95,    // 95% service level
      });

      // z-score for 95% ≈ 1.645
      expect(result.zScore).toBeCloseTo(1.645, 2);
      // σ_DDLT = sqrt(5 × 20² + 100² × 1²) = sqrt(2000 + 10000) = sqrt(12000) ≈ 109.5
      // Safety Stock = 1.645 × 109.5 ≈ 180
      expect(result.safetyStock).toBeCloseTo(180, -1);
    });

    it('should calculate reorder point', () => {
      const result = safetyStock({
        avgDemand: 100,
        demandStdDev: 20,
        avgLeadTime: 5,
        leadTimeStdDev: 1,
        serviceLevel: 0.95,
      });

      // Demand during lead time = 100 × 5 = 500
      expect(result.demandDuringLeadTime).toBe(500);
      // ROP = DDLT + Safety Stock = 500 + 180 = 680
      expect(result.reorderPoint).toBeCloseTo(680, -1);
    });
  });

  describe('service level impact', () => {
    it('should show higher service level increases safety stock', () => {
      const low = safetyStock({
        avgDemand: 100,
        demandStdDev: 20,
        avgLeadTime: 5,
        leadTimeStdDev: 1,
        serviceLevel: 0.90,
      });

      const high = safetyStock({
        avgDemand: 100,
        demandStdDev: 20,
        avgLeadTime: 5,
        leadTimeStdDev: 1,
        serviceLevel: 0.99,
      });

      expect(high.safetyStock).toBeGreaterThan(low.safetyStock);
      expect(high.zScore).toBeGreaterThan(low.zScore);
    });

    it('should calculate z-score for 99% service level', () => {
      const result = safetyStock({
        avgDemand: 100,
        demandStdDev: 20,
        avgLeadTime: 5,
        leadTimeStdDev: 1,
        serviceLevel: 0.99,
      });

      // z-score for 99% ≈ 2.326
      expect(result.zScore).toBeCloseTo(2.326, 2);
    });

    it('should calculate z-score for 50% service level', () => {
      const result = safetyStock({
        avgDemand: 100,
        demandStdDev: 20,
        avgLeadTime: 5,
        leadTimeStdDev: 1,
        serviceLevel: 0.50,
      });

      // z-score for 50% = 0
      expect(result.zScore).toBeCloseTo(0, 2);
      expect(result.safetyStock).toBe(0);
    });
  });

  describe('variability impact', () => {
    it('should show higher demand variability increases safety stock', () => {
      const lowVar = safetyStock({
        avgDemand: 100,
        demandStdDev: 10,
        avgLeadTime: 5,
        leadTimeStdDev: 1,
        serviceLevel: 0.95,
      });

      const highVar = safetyStock({
        avgDemand: 100,
        demandStdDev: 30,
        avgLeadTime: 5,
        leadTimeStdDev: 1,
        serviceLevel: 0.95,
      });

      expect(highVar.safetyStock).toBeGreaterThan(lowVar.safetyStock);
    });

    it('should show higher lead time variability increases safety stock', () => {
      const lowVar = safetyStock({
        avgDemand: 100,
        demandStdDev: 20,
        avgLeadTime: 5,
        leadTimeStdDev: 0.5,
        serviceLevel: 0.95,
      });

      const highVar = safetyStock({
        avgDemand: 100,
        demandStdDev: 20,
        avgLeadTime: 5,
        leadTimeStdDev: 2,
        serviceLevel: 0.95,
      });

      expect(highVar.safetyStock).toBeGreaterThan(lowVar.safetyStock);
    });
  });

  describe('edge cases', () => {
    it('should handle zero demand variability', () => {
      const result = safetyStock({
        avgDemand: 100,
        demandStdDev: 0,
        avgLeadTime: 5,
        leadTimeStdDev: 1,
        serviceLevel: 0.95,
      });

      // Only lead time variability contributes
      // σ_DDLT = sqrt(0 + 100² × 1²) = 100
      expect(result.safetyStock).toBeCloseTo(165, -1);
    });

    it('should handle zero lead time variability', () => {
      const result = safetyStock({
        avgDemand: 100,
        demandStdDev: 20,
        avgLeadTime: 5,
        leadTimeStdDev: 0,
        serviceLevel: 0.95,
      });

      // Only demand variability contributes
      // σ_DDLT = sqrt(5 × 20²) = sqrt(2000) ≈ 44.7
      expect(result.safetyStock).toBeCloseTo(74, -1);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for fast-moving consumer goods', () => {
      const result = safetyStock({
        avgDemand: 500,       // High daily demand
        demandStdDev: 100,    // Significant variability
        avgLeadTime: 3,       // Short lead time
        leadTimeStdDev: 0.5,  // Low variability
        serviceLevel: 0.98,   // High service level
      });

      expect(result.safetyStock).toBeGreaterThan(300);
      expect(result.reorderPoint).toBeGreaterThan(1800);
    });

    it('should calculate for slow-moving spare parts', () => {
      const result = safetyStock({
        avgDemand: 5,         // Low daily demand
        demandStdDev: 3,      // High relative variability
        avgLeadTime: 30,      // Long lead time
        leadTimeStdDev: 7,    // High variability
        serviceLevel: 0.99,   // Very high service level
      });

      expect(result.demandDuringLeadTime).toBe(150);
      expect(result.safetyStock).toBeGreaterThan(50);
    });
  });
});
