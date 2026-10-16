import { describe, it, expect } from 'vitest';
import { containerFit } from './containerFit.js';

describe('containerFit', () => {
  describe('basic fitting', () => {
    it('should calculate units that fit in container', () => {
      const result = containerFit({
        container: { length: 12000, width: 2350, height: 2400 },
        cargo: { length: 600, width: 400, height: 500 },
        rotation: 'fixed',
      });

      expect(result.totalUnits).toBeGreaterThan(0);
      expect(result.unitsPerLayer).toBeGreaterThan(0);
      expect(result.layers).toBeGreaterThan(0);
    });

    it('should return zero when box does not fit', () => {
      const result = containerFit({
        container: { length: 500, width: 500, height: 500 },
        cargo: { length: 600, width: 400, height: 500 },
        rotation: 'fixed',
      });

      expect(result.totalUnits).toBe(0);
    });
  });

  describe('rotation optimization', () => {
    it('should find better fit with rotation allowed', () => {
      const noRotation = containerFit({
        container: { length: 1200, width: 800, height: 1000 },
        cargo: { length: 500, width: 300, height: 400 },
        rotation: 'fixed',
      });

      const withRotation = containerFit({
        container: { length: 1200, width: 800, height: 1000 },
        cargo: { length: 500, width: 300, height: 400 },
        rotation: 'full',
      });

      expect(withRotation.totalUnits).toBeGreaterThanOrEqual(noRotation.totalUnits);
    });

    it('should return best orientation', () => {
      const result = containerFit({
        container: { length: 1200, width: 800, height: 1000 },
        cargo: { length: 500, width: 300, height: 400 },
        rotation: 'full',
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
        rotation: 'full',
      });

      expect(result.totalUnits).toBeGreaterThan(100);
    });

    it('should calculate for 40ft container', () => {
      const result = containerFit({
        container: { length: 12000, width: 2350, height: 2390 }, // 40ft
        cargo: { length: 600, width: 400, height: 400 },
        rotation: 'full',
      });

      expect(result.totalUnits).toBeGreaterThan(200);
    });
  });

  describe('edge cases', () => {
    it('should handle box exactly fitting container', () => {
      const result = containerFit({
        container: { length: 1000, width: 500, height: 500 },
        cargo: { length: 500, width: 500, height: 500 },
        rotation: 'fixed',
      });

      expect(result.totalUnits).toBe(2); // 2 boxes in length direction
    });

    it('should handle cubic boxes', () => {
      const result = containerFit({
        container: { length: 1000, width: 1000, height: 1000 },
        cargo: { length: 250, width: 250, height: 250 },
        rotation: 'fixed',
      });

      expect(result.totalUnits).toBe(64); // 4x4x4
    });
  });

  describe('layer calculation', () => {
    it('should correctly calculate layers', () => {
      const result = containerFit({
        container: { length: 1200, width: 800, height: 1500 },
        cargo: { length: 600, width: 400, height: 300 },
        rotation: 'fixed',
      });

      expect(result.layers).toBe(5); // 1500 / 300
      expect(result.unitsPerLayer).toBe(4); // (1200/600) x (800/400) = 2 x 2
    });
  });
});

describe('containerFit rejects inputs that would produce a non-finite result', () => {
  it('throws RangeError for a zero cargo dimension', () => {
    expect(() => containerFit({ container: { length: 12000, width: 2350, height: 2400 }, cargo: { length: 0, width: 400, height: 500 }, rotation: 'fixed' })).toThrow(RangeError);
  });
});

describe('containerFit with an empty container', () => {
  it('rejects a container with no inside length, width or height', () => {
    for (const container of [{ length: 0, width: 2350, height: 2390 }, { length: 5900, width: 0, height: 2390 }, { length: 5900, width: 2350, height: 0 }]) {
      expect(() => containerFit({ container, cargo: { length: 400, width: 300, height: 200 }, rotation: 'full' })).toThrow(/container length, width and height/);
    }
  });
});

// A 20 ft dry van (5898 × 2352 × 2393 mm inside), cartons 600 × 400 × 500 mm of 20 kg, as given:
// ⌊5898/600⌋ × ⌊2352/400⌋ = 9 × 5 = 45 per layer, ⌊2393/500⌋ = 4 layers, 180 cartons, 3600 kg.
describe('containerFit weight limits', () => {
  const container = { length: 5898, width: 2352, height: 2393 };
  const cargo = { length: 600, width: 400, height: 500, weight: 20 };

  it('loads by space when no weight limit binds', () => {
    const r = containerFit({ container, cargo, rotation: 'fixed', maxPayload: 28200, maxStackWeight: 1000 });
    expect(r).toMatchObject({ unitsPerLayer: 45, layers: 4, totalUnits: 180, totalWeight: 3600, limitedBy: 'space' });
    // 180 × 0.12 m³ / (5.898 × 2.352 × 2.393 m³) and 45 × 0.24 m² / (5.898 × 2.352 m²)
    expect(r.volumeUtilization).toBe(65.07);
    expect(r.floorUtilization).toBe(77.85);
  });

  it('cuts each column to what the stack weight allows', () => {
    const r = containerFit({ container, cargo, rotation: 'fixed', maxStackWeight: 50 });
    expect(r).toMatchObject({ layers: 2, totalUnits: 90, totalWeight: 1800, limitedBy: 'stack_weight' });
  });

  it('cuts the load to what the payload allows', () => {
    const r = containerFit({ container, cargo, rotation: 'fixed', maxPayload: 1000 });
    expect(r).toMatchObject({ layers: 4, totalUnits: 50, totalWeight: 1000, limitedBy: 'payload' });
  });

  it('says a column limit below one unit empties the container', () => {
    const r = containerFit({ container, cargo, rotation: 'fixed', maxStackWeight: 15 });
    expect(r).toMatchObject({ layers: 0, totalUnits: 0, totalWeight: 0, limitedBy: 'stack_weight', volumeUtilization: 0 });
  });

  it('ignores the weight limits for a weightless unit', () => {
    const r = containerFit({ container, cargo: { length: 600, width: 400, height: 500 }, rotation: 'fixed', maxPayload: 0, maxStackWeight: 0 });
    expect(r).toMatchObject({ totalUnits: 180, totalWeight: 0, limitedBy: 'space' });
  });

  it('turns a unit on edge when a column limit makes that load more', () => {
    // Flat (1000 × 1000 × 200): 2 per layer, 5 layers by space, 3 by a 300 kg column → 6.
    // On edge (1000 × 200 × 1000): 2 × 5 = 10 per layer, 1 layer → 10.
    const box = { length: 1000, width: 1000, height: 200, weight: 100 };
    const c = { length: 2000, width: 1000, height: 1000 };
    expect(containerFit({ container: c, cargo: box, rotation: 'fixed', maxStackWeight: 300 }).totalUnits).toBe(6);
    const r = containerFit({ container: c, cargo: box, rotation: 'full', maxStackWeight: 300 });
    expect(r).toMatchObject({ totalUnits: 10, layers: 1, limitedBy: 'space' });
    expect(r.bestOrientation.height).toBe(1000);
  });

  it('keeps a layered unit upright', () => {
    // 500 × 300 × 400 in 1200 × 800 × 1000: lying on its side would fit more, upright may only turn on the floor.
    const c = { length: 1200, width: 800, height: 1000 };
    const box = { length: 500, width: 300, height: 400 };
    const r = containerFit({ container: c, cargo: box, rotation: 'layered' });
    expect(r.bestOrientation.height).toBe(400);
    // as given 2 × 2 = 4, turned 4 × 1 = 4 → the given one; ⌊1000/400⌋ = 2 layers
    expect(r).toMatchObject({ unitsPerLayer: 4, layers: 2, totalUnits: 8 });
    expect(containerFit({ container: c, cargo: box, rotation: 'full' }).totalUnits).toBeGreaterThan(8);
  });

  it.each([
    ['cargo.weight', { cargo: { ...cargo, weight: -1 } }],
    ['maxPayload', { maxPayload: -1 }],
    ['maxStackWeight', { maxStackWeight: -0.5 }],
  ] as const)('refuses a negative %s', (parameter, patch) => {
    expect(() => containerFit({ container, cargo, rotation: 'fixed', ...patch })).toThrow(
      expect.objectContaining({ code: 'parameter_out_of_range', parameter, min: 0 }),
    );
  });
});

describe('containerFit names the dimension it refuses', () => {
  it.each([
    ['cargo.height', { container: { length: 5898, width: 2352, height: 2393 }, cargo: { length: 600, width: 400, height: 0 } }],
    ['container.width', { container: { length: 5898, width: -1, height: 2393 }, cargo: { length: 600, width: 400, height: 500 } }],
  ] as const)('%s', (parameter, dims) => {
    expect(() => containerFit({ ...dims, rotation: 'fixed' })).toThrow(
      expect.objectContaining({ code: 'parameter_out_of_range', parameter, exclusive_min: 0 }),
    );
  });
});

describe('containerFit maxLayers', () => {
  const container = { length: 5898, width: 2352, height: 2393 };
  const cargo = { length: 600, width: 400, height: 500, weight: 20 };

  it('keeps cargo that must not be stacked to one layer', () => {
    expect(containerFit({ container, cargo, rotation: 'fixed', maxLayers: 1 })).toMatchObject({ layers: 1, totalUnits: 45, limitedBy: 'max_layers' });
  });

  it('is the space when the space allows fewer layers', () => {
    expect(containerFit({ container, cargo, rotation: 'fixed', maxLayers: 9 })).toMatchObject({ layers: 4, totalUnits: 180, limitedBy: 'space' });
  });

  it('gives way to a tighter column weight', () => {
    // 3 layers allowed, 50 kg column → 2
    expect(containerFit({ container, cargo, rotation: 'fixed', maxLayers: 3, maxStackWeight: 50 })).toMatchObject({ layers: 2, limitedBy: 'stack_weight' });
  });

  it.each([0, 1.5, -1])('refuses %s layers', (maxLayers) => {
    expect(() => containerFit({ container, cargo, rotation: 'fixed', maxLayers })).toThrow(
      expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'maxLayers', min: 1 }),
    );
  });
});
