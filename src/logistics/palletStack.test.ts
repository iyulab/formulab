import { describe, it, expect } from 'vitest';
import { palletStack } from './palletStack.js';

describe('palletStack', () => {
  describe('basic stacking', () => {
    it('should calculate boxes per layer and total', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 400, width: 400, height: 300 },
        maxHeight: 1500,
        rotation: 'fixed',
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
        rotation: 'fixed',
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
        rotation: 'fixed',
      });

      const withRotation = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 600, width: 350, height: 300 },
        maxHeight: 1500,
        rotation: 'layered',
      });

      expect(withRotation.totalBoxes).toBeGreaterThanOrEqual(noRotation.totalBoxes);
    });

    it('should swap length and width for better fit', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 350, width: 600, height: 300 }, // Would fit better rotated
        maxHeight: 1500,
        rotation: 'layered',
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
        rotation: 'fixed',
      });

      expect(result.layers).toBe(4); // 1000/250
    });

    it('should not exceed max height', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 400, width: 400, height: 300 },
        maxHeight: 500,
        rotation: 'fixed',
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
        rotation: 'fixed',
      });

      expect(result.totalBoxes).toBe(0);
    });

    it('should return zero when box height exceeds max height', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 400, width: 400, height: 2000 },
        maxHeight: 1500,
        rotation: 'fixed',
      });

      expect(result.totalBoxes).toBe(0);
    });

    it('should fit with rotation when original does not fit', () => {
      const result = palletStack({
        pallet: { length: 1200, width: 800 },
        box: { length: 1000, width: 600, height: 300 }, // Won't fit without rotation
        maxHeight: 1500,
        rotation: 'layered',
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
        rotation: 'layered',
      });

      expect(result.boxesPerLayer).toBeGreaterThan(5);
      expect(result.layers).toBe(9);
    });

    it('should calculate US pallet stacking', () => {
      const result = palletStack({
        pallet: { length: 1219, width: 1016 }, // 48x40 inches
        box: { length: 400, width: 300, height: 250 },
        maxHeight: 1500,
        rotation: 'layered',
      });

      expect(result.totalBoxes).toBeGreaterThan(30);
    });
  });
});

describe('palletStack rejects inputs that would produce a non-finite result', () => {
  it('throws RangeError for a zero box dimension', () => {
    expect(() => palletStack({ pallet: { length: 1200, width: 800 }, box: { length: 400, width: 0, height: 300 }, maxHeight: 1500, rotation: 'fixed' })).toThrow(RangeError);
  });
});

describe('palletStack with no pallet', () => {
  it('rejects a pallet with no deck and a stack height of 0', () => {
    const box = { length: 400, width: 300, height: 200 };
    expect(() => palletStack({ pallet: { length: 0, width: 1000 }, box, maxHeight: 1500, rotation: 'layered' })).toThrow(/pallet length and width/);
    expect(() => palletStack({ pallet: { length: 1200, width: 1000 }, box, maxHeight: 0, rotation: 'layered' })).toThrow(/maxHeight must be greater than 0/);
  });
});

// A 1200 × 800 pallet stacked to 1000 mm with 400 × 300 × 250 boxes: as given 3 × 2 = 6 per layer,
// turned on the floor 4 × 2 = 8 → 8 per layer × 4 layers = 32 boxes.
describe('palletStack weight limit', () => {
  const pallet = { length: 1200, width: 800 };
  const box = { length: 400, width: 300, height: 250 };

  it('stacks by space when the weight limit does not bind', () => {
    const r = palletStack({ pallet, box, maxHeight: 1000, rotation: 'layered', boxWeight: 10, maxWeight: 1000 });
    expect(r).toMatchObject({ boxesPerLayer: 8, layers: 4, totalBoxes: 32, stackHeight: 1000, totalWeight: 320, limitedBy: 'space' });
    // 32 × 0.03 m³ / (1.2 × 0.8 × 1.0 m³)
    expect(r.volumeUtilization).toBe(100);
  });

  it('stops at the weight limit, the last layer part-filled', () => {
    const r = palletStack({ pallet, box, maxHeight: 1000, rotation: 'layered', boxWeight: 10, maxWeight: 100 });
    // 10 boxes: one full layer of 8 and 2 on the next → 2 layers tall
    expect(r).toMatchObject({ boxesPerLayer: 8, totalBoxes: 10, stackHeight: 500, totalWeight: 100, limitedBy: 'weight' });
    expect(r.volumeUtilization).toBe(31.25);
  });

  it('keeps the given orientation when fixed', () => {
    const r = palletStack({ pallet, box, maxHeight: 1000, rotation: 'fixed' });
    expect(r).toMatchObject({ boxesPerLayer: 6, totalBoxes: 24, totalWeight: 0, limitedBy: 'space' });
  });

  it.each([
    ['boxWeight', { boxWeight: -1 }],
    ['maxWeight', { maxWeight: -1 }],
  ] as const)('refuses a negative %s', (parameter, patch) => {
    expect(() => palletStack({ pallet, box, maxHeight: 1000, rotation: 'layered', ...patch })).toThrow(
      expect.objectContaining({ code: 'parameter_out_of_range', parameter, min: 0 }),
    );
  });
});

describe('palletStack names the dimension it refuses', () => {
  it.each([
    ['box.width', { pallet: { length: 1200, width: 800 }, box: { length: 400, width: 0, height: 250 } }],
    ['pallet.length', { pallet: { length: 0, width: 800 }, box: { length: 400, width: 300, height: 250 } }],
  ] as const)('%s', (parameter, dims) => {
    expect(() => palletStack({ ...dims, maxHeight: 1000, rotation: 'layered' })).toThrow(
      expect.objectContaining({ code: 'parameter_out_of_range', parameter, exclusive_min: 0 }),
    );
  });
});
