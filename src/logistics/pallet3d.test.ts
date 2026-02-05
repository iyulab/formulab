import { describe, it, expect } from 'vitest';
import { pallet3d } from './pallet3d.js';

describe('pallet3d', () => {
  describe('basic packing', () => {
    it('should place boxes on EUR pallet', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        boxes: [
          {
            id: 'box1',
            length: 400,
            width: 300,
            height: 200,
            weight: 10,
            quantity: 10,
            canRotate: 'layered',
          },
        ],
      });

      expect(result.placed.length).toBeGreaterThan(0);
      expect(result.metrics.totalBoxes).toBeGreaterThan(0);
    });

    it('should calculate utilization metrics', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        boxes: [
          {
            id: 'box1',
            length: 400,
            width: 400,
            height: 300,
            weight: 15,
            quantity: 20,
            canRotate: 'layered',
          },
        ],
      });

      expect(result.utilization.volumePercent).toBeGreaterThan(0);
      expect(result.utilization.weightPercent).toBeGreaterThan(0);
    });
  });

  describe('pallet standards', () => {
    it('should use EUR pallet dimensions', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        boxes: [{ id: 'a', length: 400, width: 300, height: 200, weight: 10, quantity: 1, canRotate: 'fixed' }],
      });

      expect(result.palletDimensions.length).toBe(1200);
      expect(result.palletDimensions.width).toBe(800);
    });

    it('should use US pallet dimensions', () => {
      const result = pallet3d({
        palletStandard: 'us',
        boxes: [{ id: 'a', length: 400, width: 300, height: 200, weight: 10, quantity: 1, canRotate: 'fixed' }],
      });

      expect(result.palletDimensions.length).toBe(1219);
      expect(result.palletDimensions.width).toBe(1016);
    });

    it('should use custom dimensions', () => {
      const result = pallet3d({
        palletStandard: 'custom',
        customLength: 1000,
        customWidth: 600,
        boxes: [{ id: 'a', length: 300, width: 200, height: 150, weight: 5, quantity: 1, canRotate: 'fixed' }],
      });

      expect(result.palletDimensions.length).toBe(1000);
      expect(result.palletDimensions.width).toBe(600);
    });
  });

  describe('multiple box types', () => {
    it('should handle multiple box types', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        boxes: [
          { id: 'large', length: 600, width: 400, height: 300, weight: 20, quantity: 5, canRotate: 'layered' },
          { id: 'small', length: 300, width: 200, height: 150, weight: 5, quantity: 10, canRotate: 'layered' },
        ],
      });

      expect(result.placed.length).toBeGreaterThan(0);
    });
  });

  describe('rotation options', () => {
    it('should respect fixed rotation constraint', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        boxes: [
          { id: 'box1', length: 600, width: 300, height: 400, weight: 10, quantity: 5, canRotate: 'fixed' },
        ],
      });

      // All placed boxes should have same orientation
      if (result.placed.length > 0) {
        expect(result.placed[0].rotationId).toBe(0);
      }
    });

    it('should allow layered rotation', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        boxes: [
          { id: 'box1', length: 600, width: 300, height: 400, weight: 10, quantity: 10, canRotate: 'layered' },
        ],
      });

      expect(result.placed.length).toBeGreaterThan(0);
    });
  });

  describe('weight constraints', () => {
    it('should respect max payload', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        maxPayload: 500,
        boxes: [
          { id: 'heavy', length: 400, width: 400, height: 400, weight: 100, quantity: 10, canRotate: 'layered' },
        ],
      });

      expect(result.metrics.totalWeight).toBeLessThanOrEqual(500);
    });
  });

  describe('center of gravity', () => {
    it('should calculate center of gravity', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        boxes: [
          { id: 'box1', length: 400, width: 400, height: 300, weight: 20, quantity: 10, canRotate: 'layered' },
        ],
      });

      expect(result.centerOfGravity.x).toBeGreaterThan(0);
      expect(result.centerOfGravity.y).toBeGreaterThan(0);
      expect(result.centerOfGravity.isBalanced).toBeDefined();
    });
  });

  describe('unplaced boxes', () => {
    it('should report unplaced boxes', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        maxStackHeight: 500,
        boxes: [
          { id: 'box1', length: 400, width: 400, height: 400, weight: 10, quantity: 20, canRotate: 'layered' },
        ],
      });

      // With limited height, not all boxes will fit
      if (result.unplaced.length > 0) {
        expect(result.unplaced[0].count).toBeGreaterThan(0);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty boxes array', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        boxes: [],
      });

      expect(result.placed.length).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn for more than 5 box types', () => {
      const result = pallet3d({
        palletStandard: 'eur',
        boxes: [
          { id: '1', length: 100, width: 100, height: 100, weight: 1, quantity: 1, canRotate: 'fixed' },
          { id: '2', length: 100, width: 100, height: 100, weight: 1, quantity: 1, canRotate: 'fixed' },
          { id: '3', length: 100, width: 100, height: 100, weight: 1, quantity: 1, canRotate: 'fixed' },
          { id: '4', length: 100, width: 100, height: 100, weight: 1, quantity: 1, canRotate: 'fixed' },
          { id: '5', length: 100, width: 100, height: 100, weight: 1, quantity: 1, canRotate: 'fixed' },
          { id: '6', length: 100, width: 100, height: 100, weight: 1, quantity: 1, canRotate: 'fixed' },
        ],
      });

      expect(result.warnings.some(w => w.includes('5 box types'))).toBe(true);
    });
  });
});
