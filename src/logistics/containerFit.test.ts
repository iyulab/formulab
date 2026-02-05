import { describe, it, expect } from 'vitest';
import { containerFit } from './containerFit.js';

describe('containerFit', () => {
  describe('basic fitting', () => {
    it('should calculate units that fit in container', () => {
      const result = containerFit({
        container: { length: 12000, width: 2350, height: 2400 },
        cargo: { length: 600, width: 400, height: 500 },
        allowRotation: false,
      });

      expect(result.totalUnits).toBeGreaterThan(0);
      expect(result.unitsPerLayer).toBeGreaterThan(0);
      expect(result.layers).toBeGreaterThan(0);
    });

    it('should return zero when box does not fit', () => {
      const result = containerFit({
        container: { length: 500, width: 500, height: 500 },
        cargo: { length: 600, width: 400, height: 500 },
        allowRotation: false,
      });

      expect(result.totalUnits).toBe(0);
    });
  });

  describe('rotation optimization', () => {
    it('should find better fit with rotation allowed', () => {
      const noRotation = containerFit({
        container: { length: 1200, width: 800, height: 1000 },
        cargo: { length: 500, width: 300, height: 400 },
        allowRotation: false,
      });

      const withRotation = containerFit({
        container: { length: 1200, width: 800, height: 1000 },
        cargo: { length: 500, width: 300, height: 400 },
        allowRotation: true,
      });

      expect(withRotation.totalUnits).toBeGreaterThanOrEqual(noRotation.totalUnits);
    });

    it('should return best orientation', () => {
      const result = containerFit({
        container: { length: 1200, width: 800, height: 1000 },
        cargo: { length: 500, width: 300, height: 400 },
        allowRotation: true,
      });

      expect(result.bestOrientation).toBeDefined();
      expect(result.bestOrientation.length).toBeGreaterThan(0);
      expect(result.bestOrientation.width).toBeGreaterThan(0);
      expect(result.bestOrientation.height).toBeGreaterThan(0);
    });
  });

  describe('standard container scenarios', () => {
    it('should calculate for 20ft container', () => {
      const result = containerFit({
        container: { length: 5900, width: 2350, height: 2390 }, // 20ft
        cargo: { length: 400, width: 400, height: 400 },
        allowRotation: true,
      });

      expect(result.totalUnits).toBeGreaterThan(100);
    });

    it('should calculate for 40ft container', () => {
      const result = containerFit({
        container: { length: 12000, width: 2350, height: 2390 }, // 40ft
        cargo: { length: 600, width: 400, height: 400 },
        allowRotation: true,
      });

      expect(result.totalUnits).toBeGreaterThan(200);
    });
  });

  describe('edge cases', () => {
    it('should handle box exactly fitting container', () => {
      const result = containerFit({
        container: { length: 1000, width: 500, height: 500 },
        cargo: { length: 500, width: 500, height: 500 },
        allowRotation: false,
      });

      expect(result.totalUnits).toBe(2); // 2 boxes in length direction
    });

    it('should handle cubic boxes', () => {
      const result = containerFit({
        container: { length: 1000, width: 1000, height: 1000 },
        cargo: { length: 250, width: 250, height: 250 },
        allowRotation: false,
      });

      expect(result.totalUnits).toBe(64); // 4x4x4
    });
  });

  describe('layer calculation', () => {
    it('should correctly calculate layers', () => {
      const result = containerFit({
        container: { length: 1200, width: 800, height: 1500 },
        cargo: { length: 600, width: 400, height: 300 },
        allowRotation: false,
      });

      expect(result.layers).toBe(5); // 1500 / 300
      expect(result.unitsPerLayer).toBe(4); // (1200/600) x (800/400) = 2 x 2
    });
  });
});
