import { describe, it, expect } from 'vitest';
import { kanban } from './kanban.js';

describe('kanban', () => {
  describe('basic calculation', () => {
    it('should calculate number of kanbans', () => {
      // K = (D × L × (1 + S)) / C = (100 × 2 × 1.2) / 50 = 4.8
      const result = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: 0.2,
        containerQuantity: 50,
      });

      expect(result.numberOfKanbans).toBe(4.8);
      expect(result.numberOfKanbansRounded).toBe(5);
    });

    it('should calculate demand during lead time', () => {
      const result = kanban({
        dailyDemand: 100,
        leadTime: 3,
        safetyFactor: 0.1,
        containerQuantity: 50,
      });

      expect(result.demandDuringLeadTime).toBe(300);
    });

    it('should calculate safety stock', () => {
      const result = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: 0.25,
        containerQuantity: 50,
      });

      // Safety stock = DDLT × safety factor = 200 × 0.25 = 50
      expect(result.safetyStock).toBe(50);
    });

    it('should calculate total requirement', () => {
      const result = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: 0.2,
        containerQuantity: 50,
      });

      // Total = DDLT × (1 + safety) = 200 × 1.2 = 240
      expect(result.totalRequirement).toBe(240);
    });
  });

  describe('rounding up', () => {
    it('should always round up kanban count', () => {
      const result = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: 0.1,
        containerQuantity: 100,
      });

      // K = (100 × 2 × 1.1) / 100 = 2.2
      expect(result.numberOfKanbans).toBe(2.2);
      expect(result.numberOfKanbansRounded).toBe(3);
    });

    it('should not round up exact integer', () => {
      const result = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: 0,
        containerQuantity: 100,
      });

      // K = (100 × 2 × 1.0) / 100 = 2.0
      expect(result.numberOfKanbans).toBe(2);
      expect(result.numberOfKanbansRounded).toBe(2);
    });
  });

  describe('safety factor impact', () => {
    it('should show higher safety factor increases kanbans', () => {
      const lowSafety = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: 0.1,
        containerQuantity: 50,
      });

      const highSafety = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: 0.5,
        containerQuantity: 50,
      });

      expect(highSafety.numberOfKanbans).toBeGreaterThan(lowSafety.numberOfKanbans);
    });

    it('should handle zero safety factor', () => {
      const result = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: 0,
        containerQuantity: 50,
      });

      expect(result.safetyStock).toBe(0);
      expect(result.totalRequirement).toBe(200);
      expect(result.numberOfKanbans).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero daily demand', () => {
      const result = kanban({
        dailyDemand: 0,
        leadTime: 2,
        safetyFactor: 0.2,
        containerQuantity: 50,
      });

      expect(result.numberOfKanbans).toBe(0);
      expect(result.numberOfKanbansRounded).toBe(0);
    });

    it('should return zeros for zero lead time', () => {
      const result = kanban({
        dailyDemand: 100,
        leadTime: 0,
        safetyFactor: 0.2,
        containerQuantity: 50,
      });

      expect(result.numberOfKanbans).toBe(0);
    });

    it('should return zeros for zero container quantity', () => {
      const result = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: 0.2,
        containerQuantity: 0,
      });

      expect(result.numberOfKanbans).toBe(0);
    });

    it('should return zeros for negative safety factor', () => {
      const result = kanban({
        dailyDemand: 100,
        leadTime: 2,
        safetyFactor: -0.1,
        containerQuantity: 50,
      });

      expect(result.numberOfKanbans).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for automotive assembly line', () => {
      const result = kanban({
        dailyDemand: 500,      // High volume
        leadTime: 0.5,         // Half-day replenishment
        safetyFactor: 0.15,    // 15% safety
        containerQuantity: 20, // Small containers
      });

      // K = (500 × 0.5 × 1.15) / 20 = 14.375
      expect(result.numberOfKanbansRounded).toBe(15);
    });

    it('should calculate for warehouse replenishment', () => {
      const result = kanban({
        dailyDemand: 50,
        leadTime: 7,           // Weekly delivery
        safetyFactor: 0.3,     // 30% safety buffer
        containerQuantity: 100,// Pallet quantity
      });

      // K = (50 × 7 × 1.3) / 100 = 4.55
      expect(result.numberOfKanbansRounded).toBe(5);
    });

    it('should calculate for just-in-time production', () => {
      const result = kanban({
        dailyDemand: 1000,
        leadTime: 0.25,        // 6-hour lead time (quarter day)
        safetyFactor: 0.1,     // Minimal safety
        containerQuantity: 50,
      });

      // K = (1000 × 0.25 × 1.1) / 50 = 5.5
      expect(result.numberOfKanbansRounded).toBe(6);
    });
  });
});
