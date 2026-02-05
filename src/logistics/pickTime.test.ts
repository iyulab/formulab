import { describe, it, expect } from 'vitest';
import { pickTime } from './pickTime.js';

describe('pickTime', () => {
  describe('single order picking', () => {
    it('should calculate total pick time', () => {
      const result = pickTime({
        mode: 'single',
        distance: 100, // meters
        speed: 50, // m/min
        itemsPerOrder: 5,
        searchTimePerItem: 10, // seconds
        pickTimePerItem: 5, // seconds
        documentationTime: 30, // seconds
      });

      expect(result.totalTime).toBeGreaterThan(0);
      expect(result.travelTime).toBeGreaterThan(0);
      expect(result.searchTime).toBe(50); // 5 items x 10s
      expect(result.pickTime).toBe(25); // 5 items x 5s
      expect(result.documentationTime).toBe(30);
    });

    it('should calculate travel time correctly', () => {
      const result = pickTime({
        mode: 'single',
        distance: 60, // meters
        speed: 60, // m/min = 1 m/s
        itemsPerOrder: 1,
        searchTimePerItem: 0,
        pickTimePerItem: 0,
        documentationTime: 0,
      });

      expect(result.travelTime).toBe(60); // 60 seconds
    });

    it('should calculate orders per hour', () => {
      const result = pickTime({
        mode: 'single',
        distance: 50,
        speed: 50,
        itemsPerOrder: 3,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 20,
      });

      expect(result.ordersPerHour).toBeGreaterThan(0);
    });
  });

  describe('batch picking', () => {
    it('should reduce travel time with batch picking', () => {
      const single = pickTime({
        mode: 'single',
        distance: 100,
        speed: 50,
        itemsPerOrder: 5,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 30,
      });

      const batch = pickTime({
        mode: 'batch',
        distance: 100,
        speed: 50,
        itemsPerOrder: 5,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 30,
        batchSize: 5,
      });

      expect(batch.travelTime).toBeLessThan(single.travelTime);
    });

    it('should divide travel time by batch size', () => {
      const result = pickTime({
        mode: 'batch',
        distance: 100,
        speed: 50, // 2 min = 120 seconds travel
        itemsPerOrder: 5,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 30,
        batchSize: 4,
      });

      // Travel time = 120 / 4 = 30 seconds per order
      expect(result.travelTime).toBe(30);
    });

    it('should not change search/pick time in batch mode', () => {
      const single = pickTime({
        mode: 'single',
        distance: 100,
        speed: 50,
        itemsPerOrder: 5,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 30,
      });

      const batch = pickTime({
        mode: 'batch',
        distance: 100,
        speed: 50,
        itemsPerOrder: 5,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 30,
        batchSize: 5,
      });

      expect(batch.searchTime).toBe(single.searchTime);
      expect(batch.pickTime).toBe(single.pickTime);
    });
  });

  describe('time calculations', () => {
    it('should return time in minutes', () => {
      const result = pickTime({
        mode: 'single',
        distance: 100,
        speed: 50,
        itemsPerOrder: 5,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 30,
      });

      expect(result.totalTimeMinutes).toBeCloseTo(result.totalTime / 60, 2);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero speed', () => {
      const result = pickTime({
        mode: 'single',
        distance: 100,
        speed: 0,
        itemsPerOrder: 5,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 30,
      });

      expect(result.totalTime).toBe(0);
      expect(result.ordersPerHour).toBe(0);
    });

    it('should return zeros for zero items', () => {
      const result = pickTime({
        mode: 'single',
        distance: 100,
        speed: 50,
        itemsPerOrder: 0,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 30,
      });

      expect(result.totalTime).toBe(0);
    });

    it('should default batch size to 1', () => {
      const result = pickTime({
        mode: 'single',
        distance: 100,
        speed: 50,
        itemsPerOrder: 5,
        searchTimePerItem: 10,
        pickTimePerItem: 5,
        documentationTime: 30,
      });

      expect(result.totalTime).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate e-commerce warehouse picking', () => {
      const result = pickTime({
        mode: 'single',
        distance: 150, // Average walk distance
        speed: 60, // Walking speed
        itemsPerOrder: 3, // Average items per order
        searchTimePerItem: 8,
        pickTimePerItem: 4,
        documentationTime: 15,
      });

      // Should complete ~20-40 orders per hour
      expect(result.ordersPerHour).toBeGreaterThan(15);
      expect(result.ordersPerHour).toBeLessThan(50);
    });

    it('should calculate batch picking productivity', () => {
      const result = pickTime({
        mode: 'batch',
        distance: 200,
        speed: 60,
        itemsPerOrder: 4,
        searchTimePerItem: 8,
        pickTimePerItem: 4,
        documentationTime: 10,
        batchSize: 10,
      });

      // Batch picking should be more productive
      expect(result.ordersPerHour).toBeGreaterThan(40);
    });
  });
});
