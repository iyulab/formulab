import { describe, it, expect } from 'vitest';
import { springback } from './springback.js';

// Kalpakjian's springback equation is an analytic closed form, not a lookup table, so
// verification is by (a) independent recomputation of the published formula from the
// cited inputs, (b) the physical invariants the equation must satisfy, and (c) validation
// behavior. Published worked examples of this equation circulate without their complete
// inputs (Y, E and T are usually omitted), so no such case is pinned here rather than
// back-fitting one — that would assert the implementation against itself.

describe('springback', () => {
  it('mild steel, R=5 t=2 (x = 250·5/(200000·2) = 0.003125 → Ks = 4x³−3x+1)', () => {
    const r = springback({ material: 'mildSteel', thickness: 2, bendRadius: 5, bendAngle: 90 });

    // Outputs are rounded (roundTo 4 for the factor, 2 for mm/degrees), so the
    // expectations are the rounded values of the independently recomputed formula.
    const x = (250 * 5) / (200 * 1000 * 2);
    const ks = 4 * x ** 3 - 3 * x + 1;                   // 0.990625…
    expect(r.springbackFactor).toBeCloseTo(ks, 4);
    expect(r.springbackFactor).toBe(0.9906);
    expect(r.finalRadius).toBeCloseTo(5 / ks, 2);        // 5.05 mm
    expect(r.overbendAngle).toBeCloseTo(90 / ks, 2);     // 90.85°
    expect(r.springbackAngle).toBeCloseTo(90 / ks - 90, 2);
    expect(r.yieldStrength).toBe(250);
    expect(r.elasticModulus).toBe(200);
  });

  it('aluminum 6061, R=10 t=1 (x = 276·10/(69000·1) = 0.04 → Ks = 0.880256)', () => {
    const r = springback({ material: 'aluminum6061', thickness: 1, bendRadius: 10, bendAngle: 90 });

    expect(r.springbackFactor).toBe(0.8803);      // 0.880256 rounded to 4 dp
    expect(r.finalRadius).toBe(11.36);            // 10 / 0.880256
    expect(r.overbendAngle).toBe(102.24);         // 90 / 0.880256
    expect(r.springbackAngle).toBe(12.24);
  });

  it('custom Y/E reproduces the equivalent preset exactly', () => {
    const preset = springback({ material: 'mildSteel', thickness: 2, bendRadius: 5, bendAngle: 90 });
    const custom = springback({
      material: 'custom', thickness: 2, bendRadius: 5, bendAngle: 90,
      yieldStrength: 250, elasticModulus: 200,
    });

    expect(custom).toEqual(preset);
  });

  it('defaults to mild steel when no material is given', () => {
    expect(springback({ thickness: 2, bendRadius: 5, bendAngle: 90 }))
      .toEqual(springback({ material: 'mildSteel', thickness: 2, bendRadius: 5, bendAngle: 90 }));
  });

  describe('physical invariants', () => {
    it('springback always opens the bend: Ks ≤ 1, R_f ≥ R_i, overbend ≥ target', () => {
      for (const material of ['mildSteel', 'stainless304', 'aluminum5052', 'aluminum6061'] as const) {
        for (const bendRadius of [2, 5, 10, 25]) {
          const r = springback({ material, thickness: 1.5, bendRadius, bendAngle: 90 });
          expect(r.springbackFactor).toBeLessThanOrEqual(1);
          expect(r.springbackFactor).toBeGreaterThan(0);
          expect(r.finalRadius).toBeGreaterThanOrEqual(bendRadius);
          expect(r.overbendAngle).toBeGreaterThanOrEqual(90);
          expect(r.springbackAngle).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('springback grows with the R/t ratio', () => {
      const tight = springback({ material: 'mildSteel', thickness: 2, bendRadius: 4, bendAngle: 90 });
      const loose = springback({ material: 'mildSteel', thickness: 2, bendRadius: 20, bendAngle: 90 });

      expect(loose.springbackFactor).toBeLessThan(tight.springbackFactor);
      expect(loose.springbackAngle).toBeGreaterThan(tight.springbackAngle);
    });

    it('aluminum springs back more than steel at identical geometry (lower E, similar Y)', () => {
      const geom = { thickness: 1, bendRadius: 10, bendAngle: 90 } as const;
      const steel = springback({ material: 'mildSteel', ...geom });
      const alu = springback({ material: 'aluminum6061', ...geom });

      expect(alu.springbackAngle).toBeGreaterThan(steel.springbackAngle);
      expect(alu.finalRadius).toBeGreaterThan(steel.finalRadius);
    });

    it('a very stiff/thick case approaches no springback (Ks → 1)', () => {
      const r = springback({ material: 'mildSteel', thickness: 20, bendRadius: 1, bendAngle: 90 });

      expect(r.springbackFactor).toBeCloseTo(1, 3);   // 0.9998
      expect(r.springbackAngle).toBeLessThan(0.05);   // 0.02° — negligible
      expect(r.finalRadius).toBeCloseTo(1, 2);
    });
  });

  describe('validation', () => {
    it('throws on non-positive thickness, radius or angle', () => {
      expect(() => springback({ thickness: 0, bendRadius: 5, bendAngle: 90 })).toThrow(RangeError);
      expect(() => springback({ thickness: 2, bendRadius: 0, bendAngle: 90 })).toThrow(RangeError);
      expect(() => springback({ thickness: 2, bendRadius: -1, bendAngle: 90 })).toThrow(RangeError);
      expect(() => springback({ thickness: 2, bendRadius: 5, bendAngle: 0 })).toThrow(RangeError);
      expect(() => springback({ thickness: 2, bendRadius: 5, bendAngle: 180 })).toThrow(RangeError);
    });

    it('throws when custom material omits yield strength or elastic modulus', () => {
      expect(() => springback({ material: 'custom', thickness: 2, bendRadius: 5, bendAngle: 90, elasticModulus: 200 }))
        .toThrow(RangeError);
      expect(() => springback({ material: 'custom', thickness: 2, bendRadius: 5, bendAngle: 90, yieldStrength: 250 }))
        .toThrow(RangeError);
      expect(() => springback({ material: 'custom', thickness: 2, bendRadius: 5, bendAngle: 90, yieldStrength: 0, elasticModulus: 200 }))
        .toThrow(RangeError);
    });

    it('never returns NaN or Infinity in any output field', () => {
      const r = springback({ material: 'aluminum5052', thickness: 0.5, bendRadius: 30, bendAngle: 120 });
      for (const v of Object.values(r)) expect(Number.isFinite(v)).toBe(true);
    });
  });
});
