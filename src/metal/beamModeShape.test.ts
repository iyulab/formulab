import { describe, it, expect } from 'vitest';
import { beamModeShape } from './beamModeShape.js';
import { vibration } from './vibration.js';

const trapezoid = (a: number[], b: number[]) => {
  let sum = 0;
  for (let i = 1; i < a.length; i++) sum += ((a[i] * b[i] + a[i - 1] * b[i - 1]) / 2) / (a.length - 1);
  return sum;
};

describe('beamModeShape', () => {
  describe('cantilever', () => {
    it('characteristic values are the published roots 1.875104, 4.694091, 7.854757', () => {
      // Blevins (2016): the first three roots of 1 + cos λ · cosh λ = 0
      expect(beamModeShape({ system: 'cantilever', mode: 1 }).characteristicValue).toBeCloseTo(1.875104, 5);
      expect(beamModeShape({ system: 'cantilever', mode: 2 }).characteristicValue).toBeCloseTo(4.694091, 5);
      expect(beamModeShape({ system: 'cantilever', mode: 3 }).characteristicValue).toBeCloseTo(7.854757, 5);
    });

    it('every returned root satisfies the frequency equation (modes 1-10)', () => {
      for (let n = 1; n <= 10; n++) {
        const lambda = beamModeShape({ system: 'cantilever', mode: n }).characteristicValue;
        // relative to cosh: the residual of 1 + cos·cosh, scaled by 1/cosh
        expect(Math.cos(lambda) + 1 / Math.cosh(lambda)).toBeCloseTo(0, 5);
      }
    });

    it('has no node in mode 1 and the published node 0.7834 in mode 2', () => {
      // the second-mode node of a clamped-free beam, x/L = 0.7834 (a standard figure; Blevins' mode-shape tables)
      expect(beamModeShape({ system: 'cantilever', mode: 1 }).nodes).toEqual([]);
      const second = beamModeShape({ system: 'cantilever', mode: 2 }).nodes;
      expect(second).toHaveLength(1);
      expect(second[0]).toBeCloseTo(0.7834, 3);
    });

    it('mode-3 nodes are zeros of the closed-form shape evaluated directly from the root', () => {
      // not a published value: the textbook expression with λ_3 = 7.854757438 and σ from its definition,
      // bisected here independently of the implementation's stable form
      const lam = 7.854757438;
      const sigma = (Math.cosh(lam) + Math.cos(lam)) / (Math.sinh(lam) + Math.sin(lam));
      const phi = (x: number) => Math.cosh(lam * x) - Math.cos(lam * x) - sigma * (Math.sinh(lam * x) - Math.sin(lam * x));
      const zero = (a: number, b: number) => {
        for (let i = 0; i < 80; i++) { const m = (a + b) / 2; if (phi(a) * phi(m) <= 0) b = m; else a = m; }
        return a;
      };
      const nodes = beamModeShape({ system: 'cantilever', mode: 3 }).nodes;
      expect(nodes).toHaveLength(2);
      expect(nodes[0]).toBeCloseTo(zero(0.45, 0.55), 3);
      expect(nodes[1]).toBeCloseTo(zero(0.8, 0.95), 3);
    });

    it('mode n has n-1 nodes', () => {
      for (let n = 1; n <= 10; n++) {
        expect(beamModeShape({ system: 'cantilever', mode: n }).nodes).toHaveLength(n - 1);
      }
    });

    it('is clamped at 0 (zero deflection), free at 1 (the peak, positive), peak magnitude 1', () => {
      for (let n = 1; n <= 5; n++) {
        const { points } = beamModeShape({ system: 'cantilever', mode: n }, 401);
        expect(points[0].position).toBe(0);
        expect(points[0].amplitude).toBe(0);
        expect(points[400].position).toBe(1);
        expect(points[400].amplitude).toBeCloseTo(1, 5);
        expect(Math.max(...points.map(p => Math.abs(p.amplitude)))).toBeLessThanOrEqual(1 + 1e-9);
        // zero slope at the clamp: the first step off the wall is second order
        expect(Math.abs(points[1].amplitude)).toBeLessThan(0.01);
      }
    });

    it('modes are orthogonal (∫φ1·φ2 = 0, ∫φ1·φ3 = 0, ∫φ2·φ3 = 0)', () => {
      const amp = (mode: number) => beamModeShape({ system: 'cantilever', mode }, 2001).points.map(p => p.amplitude);
      const [a, b, c] = [amp(1), amp(2), amp(3)];
      expect(trapezoid(a, b)).toBeCloseTo(0, 3);
      expect(trapezoid(a, c)).toBeCloseTo(0, 3);
      expect(trapezoid(b, c)).toBeCloseTo(0, 3);
      // ... and a mode is not orthogonal to itself
      expect(trapezoid(a, a)).toBeGreaterThan(0.2);
    });

    it('agrees with the characteristic values vibration() computes its frequencies from', () => {
      const v = vibration({ system: 'cantilever', material: 'steel', length: 500, crossSection: 'circular', diameter: 20 });
      const f1 = v.frequencies[0].frequency;
      const f2 = v.frequencies[1].frequency;
      const l1 = beamModeShape({ system: 'cantilever', mode: 1 }).characteristicValue;
      const l2 = beamModeShape({ system: 'cantilever', mode: 2 }).characteristicValue;
      expect(f2 / f1).toBeCloseTo((l2 / l1) ** 2, 2);
    });
  });

  describe('simplySupported', () => {
    it('λ = nπ, nodes at k/n, amplitude sin(nπξ) with the first lobe positive', () => {
      const r = beamModeShape({ system: 'simplySupported', mode: 3 }, 61);
      expect(r.characteristicValue).toBeCloseTo(3 * Math.PI, 5);
      expect(r.nodes).toEqual([0.3333, 0.6667]);
      expect(r.points[0].amplitude).toBe(0);
      expect(r.points[60].amplitude).toBeCloseTo(0, 6);
      expect(r.points[10].amplitude).toBeCloseTo(1, 6); // ξ = 1/6, the first peak
      expect(r.points[30].amplitude).toBeCloseTo(-1, 6); // ξ = 1/2
    });

    it('mode 1 has no node and peaks at midspan', () => {
      const r = beamModeShape({ system: 'simplySupported', mode: 1 }, 101);
      expect(r.nodes).toEqual([]);
      expect(r.points[50].amplitude).toBeCloseTo(1, 6);
    });
  });

  describe('sampling', () => {
    it('count sets the number of samples from 0 to 1 and does not change the shape', () => {
      const coarse = beamModeShape({ system: 'cantilever', mode: 2 }, 11);
      const fine = beamModeShape({ system: 'cantilever', mode: 2 }, 101);
      expect(coarse.points).toHaveLength(11);
      expect(fine.points).toHaveLength(101);
      expect(coarse.nodes).toEqual(fine.nodes);
      expect(coarse.points[5].amplitude).toBe(fine.points[50].amplitude);
    });

    it('defaults to 101 samples', () => {
      expect(beamModeShape({ system: 'cantilever', mode: 1 }).points).toHaveLength(101);
    });
  });

  describe('validation', () => {
    it('refuses an unknown system', () => {
      expect(() => beamModeShape({ system: 'fixed' as never, mode: 1 })).toThrow(RangeError);
      try {
        beamModeShape({ system: 'fixed' as never, mode: 1 });
      } catch (e) {
        expect((e as { code?: string }).code).toBe('unknown_option');
      }
    });

    it('refuses a mode that is not an integer from 1 to 10', () => {
      for (const mode of [0, -1, 1.5, 11, 100]) {
        expect(() => beamModeShape({ system: 'cantilever', mode })).toThrow(RangeError);
      }
    });

    it('refuses a count below 2 or not an integer', () => {
      expect(() => beamModeShape({ system: 'cantilever', mode: 1 }, 1)).toThrow(RangeError);
      expect(() => beamModeShape({ system: 'cantilever', mode: 1 }, 10.5)).toThrow(RangeError);
    });

    it('refuses non-finite input', () => {
      expect(() => beamModeShape({ system: 'cantilever', mode: NaN })).toThrow(RangeError);
      expect(() => beamModeShape({ system: 'cantilever', mode: 1 }, Infinity)).toThrow(RangeError);
    });
  });
});
