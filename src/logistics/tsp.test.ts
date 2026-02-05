import { describe, it, expect } from 'vitest';
import { tsp } from './tsp.js';

describe('tsp', () => {
  describe('small instances', () => {
    it('should solve 2-node problem', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 3, y: 4 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.nnTour).toEqual([0, 1]);
      expect(result!.nnDistance).toBe(10); // 2 * sqrt(9+16) = 10
      expect(result!.optimizedDistance).toBe(10);
      expect(result!.improvementPercent).toBe(0);
    });

    it('should solve 3-node triangle', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 4, y: 0 },
          { x: 2, y: 3 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.optimizedTour.length).toBe(3);
      expect(result!.optimalDistance).toBeDefined();
    });

    it('should solve 4-node square', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.optimalDistance).toBe(4); // Perimeter of unit square
    });

    it('should provide optimal solution for small instances', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.optimalDistance).toBeDefined();
      expect(result!.optimalityGap).toBeDefined();
      expect(result!.optimalDistance).toBe(8); // 0->4->0 = 8
    });
  });

  describe('nearest neighbor heuristic', () => {
    it('should produce valid tour', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 5, y: 8 },
          { x: 2, y: 4 },
          { x: 8, y: 4 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.nnTour.length).toBe(5);
      // Check all nodes are visited
      const sorted = [...result!.nnTour].sort((a, b) => a - b);
      expect(sorted).toEqual([0, 1, 2, 3, 4]);
    });

    it('should select nearest unvisited node', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
          { x: 1, y: 0 },
        ],
      });

      // Starting from 0, should visit 2 (nearest) before 1
      expect(result!.nnDistance).toBeLessThan(202);
    });
  });

  describe('2-opt improvement', () => {
    it('should improve or equal NN solution', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 10 },
          { x: 0, y: 10 },
          { x: 5, y: 5 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.optimizedDistance).toBeLessThanOrEqual(result!.nnDistance);
    });

    it('should calculate improvement percentage', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 2, y: 0 },
          { x: 4, y: 0 },
          { x: 4, y: 2 },
          { x: 2, y: 2 },
          { x: 0, y: 2 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.improvementPercent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('optimality gap', () => {
    it('should calculate gap from optimal', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      });

      expect(result!.optimalityGap).toBeDefined();
      expect(result!.optimalityGap).toBeGreaterThanOrEqual(0);
    });

    it('should have zero gap when optimal found', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 1 },
          { x: 0, y: 1 },
        ],
      });

      // 2-opt should find optimal for simple cases
      expect(result!.optimizedDistance).toBe(result!.optimalDistance);
    });
  });

  describe('edge cases', () => {
    it('should return null for empty nodes', () => {
      const result = tsp({ nodes: [] });
      expect(result).toBeNull();
    });

    it('should handle single node', () => {
      const result = tsp({
        nodes: [{ x: 5, y: 5 }],
      });

      expect(result).not.toBeNull();
      expect(result!.nnTour).toEqual([0]);
      expect(result!.nnDistance).toBe(0);
      expect(result!.optimizedDistance).toBe(0);
    });

    it('should handle collinear points', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 2, y: 0 },
          { x: 4, y: 0 },
          { x: 6, y: 0 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.optimalDistance).toBe(12); // 0->6->0 = 12
    });

    it('should handle coincident points', () => {
      const result = tsp({
        nodes: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          { x: 1, y: 0 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.optimizedDistance).toBe(2);
    });
  });

  describe('larger instances', () => {
    it('should handle 10 nodes (brute force boundary)', () => {
      const nodes = Array.from({ length: 10 }, (_, i) => ({
        x: Math.cos((2 * Math.PI * i) / 10) * 10,
        y: Math.sin((2 * Math.PI * i) / 10) * 10,
      }));

      const result = tsp({ nodes });

      expect(result).not.toBeNull();
      expect(result!.optimalDistance).toBeDefined(); // Still within brute force range
      expect(result!.optimizedTour.length).toBe(10);
    });

    it('should handle instances larger than brute force limit', () => {
      const nodes = Array.from({ length: 15 }, (_, i) => ({
        x: i * 10,
        y: (i % 2) * 10,
      }));

      const result = tsp({ nodes });

      expect(result).not.toBeNull();
      expect(result!.optimalDistance).toBeUndefined(); // Beyond brute force
      expect(result!.optimalityGap).toBeUndefined();
      expect(result!.optimizedTour.length).toBe(15);
    });
  });

  describe('real-world scenarios', () => {
    it('should solve delivery route optimization', () => {
      // Delivery points in a city grid
      const result = tsp({
        nodes: [
          { x: 0, y: 0 }, // Depot
          { x: 2, y: 3 },
          { x: 5, y: 1 },
          { x: 7, y: 4 },
          { x: 3, y: 6 },
          { x: 1, y: 5 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.optimizedDistance).toBeLessThan(result!.nnDistance * 1.1);
    });

    it('should solve warehouse picking route', () => {
      // Aisle positions
      const result = tsp({
        nodes: [
          { x: 0, y: 0 }, // Start
          { x: 0, y: 10 },
          { x: 0, y: 20 },
          { x: 5, y: 20 },
          { x: 5, y: 10 },
          { x: 5, y: 0 },
        ],
      });

      expect(result).not.toBeNull();
      // Optimal route should follow snake pattern
      expect(result!.optimalDistance).toBeLessThanOrEqual(50);
    });

    it('should solve circuit board drilling optimization', () => {
      // Random hole positions
      const result = tsp({
        nodes: [
          { x: 10, y: 10 },
          { x: 25, y: 15 },
          { x: 40, y: 10 },
          { x: 40, y: 30 },
          { x: 25, y: 35 },
          { x: 10, y: 30 },
          { x: 20, y: 22 },
        ],
      });

      expect(result).not.toBeNull();
      expect(result!.improvementPercent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('performance characteristics', () => {
    it('should complete within reasonable time for moderate instances', () => {
      const nodes = Array.from({ length: 20 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
      }));

      const start = Date.now();
      const result = tsp({ nodes });
      const elapsed = Date.now() - start;

      expect(result).not.toBeNull();
      expect(elapsed).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
