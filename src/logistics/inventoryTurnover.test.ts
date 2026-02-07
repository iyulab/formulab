import { describe, it, expect } from 'vitest';
import { inventoryTurnover } from './inventoryTurnover.js';

describe('inventoryTurnover', () => {
  describe('turnover ratio calculation', () => {
    it('should calculate turnover ratio correctly', () => {
      const result = inventoryTurnover({
        cogs: 5000000,
        averageInventory: 1000000,
      });

      // turnoverRatio = 5,000,000 / 1,000,000 = 5.0
      expect(result.turnoverRatio).toBe(5);
    });

    it('should calculate days of supply correctly', () => {
      const result = inventoryTurnover({
        cogs: 5000000,
        averageInventory: 1000000,
      });

      // daysOfSupply = 365 / 5 = 73 days
      expect(result.daysOfSupply).toBe(73);
    });

    it('should calculate weeks of supply correctly', () => {
      const result = inventoryTurnover({
        cogs: 5000000,
        averageInventory: 1000000,
      });

      // weeksOfSupply = 73 / 7 = 10.4286 weeks
      expect(result.weeksOfSupply).toBeCloseTo(10.4286, 3);
    });
  });

  describe('custom period', () => {
    it('should use custom period days', () => {
      const result = inventoryTurnover({
        cogs: 1000000,
        averageInventory: 250000,
        periodDays: 90, // quarterly
      });

      // turnoverRatio = 1,000,000 / 250,000 = 4
      // daysOfSupply = 90 / 4 = 22.5
      expect(result.turnoverRatio).toBe(4);
      expect(result.daysOfSupply).toBe(22.5);
    });
  });

  describe('GMROII', () => {
    it('should calculate GMROII when gross margin provided', () => {
      const result = inventoryTurnover({
        cogs: 5000000,
        averageInventory: 1000000,
        grossMargin: 2000000,
      });

      // gmroii = 2,000,000 / 1,000,000 × 100 = 200%
      expect(result.gmroii).toBe(200);
    });

    it('should return null GMROII when gross margin not provided', () => {
      const result = inventoryTurnover({
        cogs: 5000000,
        averageInventory: 1000000,
      });

      expect(result.gmroii).toBeNull();
    });

    it('should handle low margin scenario', () => {
      const result = inventoryTurnover({
        cogs: 8000000,
        averageInventory: 2000000,
        grossMargin: 500000,
      });

      // gmroii = 500,000 / 2,000,000 × 100 = 25%
      expect(result.gmroii).toBe(25);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero average inventory', () => {
      const result = inventoryTurnover({
        cogs: 5000000,
        averageInventory: 0,
      });

      expect(result.turnoverRatio).toBe(0);
      expect(result.daysOfSupply).toBe(0);
    });

    it('should return zeros for zero COGS', () => {
      const result = inventoryTurnover({
        cogs: 0,
        averageInventory: 1000000,
      });

      expect(result.turnoverRatio).toBe(0);
    });

    it('should handle very high turnover (fast-moving goods)', () => {
      const result = inventoryTurnover({
        cogs: 50000000,
        averageInventory: 1000000,
      });

      // turnoverRatio = 50
      // daysOfSupply = 365 / 50 = 7.3 days
      expect(result.turnoverRatio).toBe(50);
      expect(result.daysOfSupply).toBe(7.3);
    });

    it('should handle very low turnover (slow-moving goods)', () => {
      const result = inventoryTurnover({
        cogs: 100000,
        averageInventory: 500000,
      });

      // turnoverRatio = 0.2
      // daysOfSupply = 365 / 0.2 = 1825 days
      expect(result.turnoverRatio).toBe(0.2);
      expect(result.daysOfSupply).toBe(1825);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate typical retail inventory metrics', () => {
      const result = inventoryTurnover({
        cogs: 12000000,
        averageInventory: 2000000,
        grossMargin: 4000000,
      });

      expect(result.turnoverRatio).toBe(6);
      expect(result.daysOfSupply).toBeCloseTo(60.83, 1);
      expect(result.gmroii).toBe(200);
    });
  });
});
