import { describe, it, expect } from 'vitest';
import { boxGridLayout } from './boxGridLayout.js';
import { palletStack } from './palletStack.js';
import { containerFit } from './containerFit.js';

describe('boxGridLayout', () => {
  it('a 1200 x 800 mm pallet takes 4 x 4 boxes of 300 x 200 mm with nothing left over', () => {
    const r = boxGridLayout({ area: { length: 1200, width: 800 }, box: { length: 300, width: 200 } });
    expect(r.columns).toBe(4);
    expect(r.rows).toBe(4);
    expect(r.boxes).toHaveLength(16);
    expect(r.unusedLength).toBe(0);
    expect(r.unusedWidth).toBe(0);
    expect(r.placementsOmitted).toBe(false);
  });

  it('places boxes along the length first, from the corner, and reports the leftover strips', () => {
    const r = boxGridLayout({ area: { length: 1200, width: 800 }, box: { length: 400, width: 300 } });
    expect(r.columns).toBe(3);
    expect(r.rows).toBe(2); // 800 / 300 = 2.67
    expect(r.unusedLength).toBe(0);
    expect(r.unusedWidth).toBe(200);
    expect(r.boxes.map(b => [b.x, b.y])).toEqual([[0, 0], [400, 0], [800, 0], [0, 300], [400, 300], [800, 300]]);
    expect(r.boxes.every(b => b.length === 400 && b.width === 300)).toBe(true);
  });

  it('every placement lies inside the area and no two overlap', () => {
    const area = { length: 2352, width: 2393 };
    const box = { length: 410, width: 330 };
    const r = boxGridLayout({ area, box });
    for (const b of r.boxes) {
      expect(b.x + b.length).toBeLessThanOrEqual(area.length);
      expect(b.y + b.width).toBeLessThanOrEqual(area.width);
    }
    for (let i = 0; i < r.boxes.length; i++) {
      for (let j = i + 1; j < r.boxes.length; j++) {
        const a = r.boxes[i];
        const c = r.boxes[j];
        const apart = a.x + a.length <= c.x || c.x + c.length <= a.x || a.y + a.width <= c.y || c.y + c.width <= a.y;
        expect(apart).toBe(true);
      }
    }
  });

  it('a box larger than the area on either side gives no placements', () => {
    const r = boxGridLayout({ area: { length: 500, width: 400 }, box: { length: 600, width: 100 } });
    expect(r.columns).toBe(0);
    expect(r.boxes).toEqual([]);
    expect(r.unusedLength).toBe(500);
    expect(r.placementsOmitted).toBe(false);
  });

  it('keeps fractional steps free of float noise', () => {
    const r = boxGridLayout({ area: { length: 1, width: 0.3 }, box: { length: 0.1, width: 0.1 } });
    expect(r.columns).toBe(10);
    expect(r.boxes[3].x).toBe(0.3);
    expect(r.boxes[2].y).toBe(0);
  });

  it('leaves the placements out above 5,000 boxes while the counts stay exact', () => {
    const r = boxGridLayout({ area: { length: 12032, width: 2352 }, box: { length: 20, width: 20 } });
    expect(r.columns).toBe(601);
    expect(r.rows).toBe(117);
    expect(r.placementsOmitted).toBe(true);
    expect(r.boxes).toEqual([]);
    expect(r.unusedLength).toBe(12);
    expect(r.unusedWidth).toBe(12);
  });

  describe('counts what palletStack() and containerFit() count', () => {
    const cases: [number, number, number, number, number][] = [
      [1200, 800, 400, 300, 250],
      [1200, 1000, 330, 220, 180],
      [1100, 1100, 300, 300, 300],
      [12032, 2352, 600, 400, 300],
    ];
    for (const [pl, pw, bl, bw, bh] of cases) {
      it(`${pl} x ${pw} floor, box ${bl} x ${bw} x ${bh}`, () => {
        const stack = palletStack({ pallet: { length: pl, width: pw }, box: { length: bl, width: bw, height: bh }, maxHeight: 2000, rotation: 'full' });
        const o = stack.bestOrientation;
        const grid = boxGridLayout({ area: { length: pl, width: pw }, box: { length: o.length, width: o.width } });
        expect(grid.columns * grid.rows).toBe(stack.boxesPerLayer);

        const fit = containerFit({ container: { length: pl, width: pw, height: 2000 }, cargo: { length: bl, width: bw, height: bh }, rotation: 'full' });
        const f = fit.bestOrientation;
        const layer = boxGridLayout({ area: { length: pl, width: pw }, box: { length: f.length, width: f.width } });
        expect(layer.columns * layer.rows).toBe(fit.unitsPerLayer);
      });
    }
  });

  describe('validation', () => {
    it('refuses a non-positive dimension, naming it', () => {
      const bad = [
        { area: { length: 0, width: 800 }, box: { length: 100, width: 100 } },
        { area: { length: 1200, width: -1 }, box: { length: 100, width: 100 } },
        { area: { length: 1200, width: 800 }, box: { length: 0, width: 100 } },
        { area: { length: 1200, width: 800 }, box: { length: 100, width: 0 } },
      ];
      for (const input of bad) expect(() => boxGridLayout(input)).toThrow(RangeError);
      try {
        boxGridLayout(bad[2]);
      } catch (e) {
        expect((e as { parameter?: string }).parameter).toBe('box.length');
      }
    });

    it('refuses non-finite input', () => {
      expect(() => boxGridLayout({ area: { length: NaN, width: 800 }, box: { length: 100, width: 100 } })).toThrow(RangeError);
      expect(() => boxGridLayout({ area: { length: 1200, width: 800 }, box: { length: Infinity, width: 100 } })).toThrow(RangeError);
    });
  });
});
