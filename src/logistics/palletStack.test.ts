import { describe, it, expect } from 'vitest';
import { palletStack } from './palletStack.js';

describe('palletStack', () => {
  describe('basic stacking', () => {
    it('should calculate boxes per layer and total', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 400, width: 400, height: 300 },
        maxHeight: 1500,
        allowRotation: false,
      });

      expect(result.boxesPerLayer).toBe(6); // 3x2
      expect(result.layers).toBe(5); // 1500/300
      expect(result.totalBoxes).toBe(30); // 6x5
    });

    it('should return best orientation', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 400, width: 400, height: 300 },
        maxHeight: 1500,
        allowRotation: false,
      });

      expect(result.bestOrientation.length).toBe(400);
      expect(result.bestOrientation.width).toBe(400);
      expect(result.bestOrientation.height).toBe(300);
    });
  });

  describe('rotation optimization', () => {
    it('should optimize with rotation allowed', () => {
      const noRotation = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 600, width: 350, height: 300 },
        maxHeight: 1500,
        allowRotation: false,
      });

      const withRotation = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 600, width: 350, height: 300 },
        maxHeight: 1500,
        allowRotation: true,
      });

      expect(withRotation.totalBoxes).toBeGreaterThanOrEqual(noRotation.totalBoxes);
    });

    it('should swap length and width for better fit', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 350, width: 600, height: 300 }, // Would fit better rotated
        maxHeight: 1500,
        allowRotation: true,
      });

      expect(result.totalBoxes).toBeGreaterThan(0);
    });
  });

  describe('layer calculations', () => {
    it('should calculate correct number of layers', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 400, width: 400, height: 250 },
        maxHeight: 1000,
        allowRotation: false,
      });

      expect(result.layers).toBe(4); // 1000/250
    });

    it('should not exceed max height', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 400, width: 400, height: 300 },
        maxHeight: 500,
        allowRotation: false,
      });

      expect(result.layers).toBe(1); // Only one layer fits
      expect(result.totalBoxes).toBe(6);
    });
  });

  describe('edge cases', () => {
    it('should return zero when box does not fit on pallet', () => {
      const result = palletStack({
        pallet: { length: 500, width: 500 },
        box: { length: 600, width: 400, height: 300 },
        maxHeight: 1500,
        allowRotation: false,
      });

      expect(result.totalBoxes).toBe(0);
    });

    it('should return zero when box height exceeds max height', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 400, width: 400, height: 2000 },
        maxHeight: 1500,
        allowRotation: false,
      });

      expect(result.totalBoxes).toBe(0);
    });

    it('should fit with rotation when original does not fit', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 1000, width: 600, height: 300 }, // Won't fit without rotation
        maxHeight: 1500,
        allowRotation: true,
      });

      expect(result.totalBoxes).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate EUR pallet stacking', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 }, // EUR pallet
        box: { length: 400, width: 300, height: 200 },
        maxHeight: 1800, // Typical truck height
        allowRotation: true,
      });

      expect(result.boxesPerLayer).toBeGreaterThan(5);
      expect(result.layers).toBe(9);
    });

    it('should calculate US pallet stacking', () => {
      const result = palletStack({
        pallet: { length: 1219, width: 1016 }, // 48x40 inches
        box: { length: 400, width: 300, height: 250 },
        maxHeight: 1500,
        allowRotation: true,
      });

      expect(result.totalBoxes).toBeGreaterThan(30);
    });
  });
});
