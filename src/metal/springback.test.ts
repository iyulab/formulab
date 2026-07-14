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

    it('never returns NaN or Infinity in any numeric output field', () => {
      const r = springback({ material: 'aluminum5052', thickness: 0.5, bendRadius: 30, bendAngle: 120 });
      for (const v of Object.values(r).filter((v): v is number => typeof v === 'number')) {
        expect(Number.isFinite(v)).toBe(true);
      }
    });
  });

  describe('overbendExceeds180 disclosure', () => {
    // mild steel t=2 R=5 → Ks = 0.990625122…; overbend crosses 180° between target 178°
    // (179.68°) and 179° (180.69°). Pinned on both sides of the boundary.
    it('false just below the boundary (target 178° → overbend 179.68°)', () => {
      const r = springback({ material: 'mildSteel', thickness: 2, bendRadius: 5, bendAngle: 178 });
      expect(r.overbendAngle).toBe(179.68);
      expect(r.overbendExceeds180).toBe(false);
    });

    it('true just above the boundary (target 179° → overbend 180.69°)', () => {
      const r = springback({ material: 'mildSteel', thickness: 2, bendRadius: 5, bendAngle: 179 });
      expect(r.overbendAngle).toBe(180.69);
      expect(r.overbendExceeds180).toBe(true);
    });

    it('true for the issue reproductions (ISSUE-20260714 sweep cases)', () => {
      const a = springback({ material: 'mildSteel', thickness: 0.5, bendRadius: 10, bendAngle: 175 });
      expect(a.overbendAngle).toBe(189.18);
      expect(a.overbendExceeds180).toBe(true);

      const b = springback({ material: 'mildSteel', thickness: 0.5, bendRadius: 20, bendAngle: 179 });
      expect(b.overbendAngle).toBe(210.46);
      expect(b.overbendExceeds180).toBe(true);
    });

    it('always true where the 4 dp springbackFactor collapses to 0 (near the elastic limit)', () => {
      // x = 0.4975 → Ks ≈ 3.7e-5 → overbend astronomically > 180°, so the region where
      // the rounded factor reads 0 is always accompanied by the disclosure flag.
      const r = springback({ material: 'mildSteel', thickness: 0.5, bendRadius: 199, bendAngle: 90 });
      expect(r.springbackFactor).toBe(0);
      expect(r.overbendExceeds180).toBe(true);
    });

    it('false across ordinary bends (the flag does not fire spuriously)', () => {
      for (const material of ['mildSteel', 'stainless304', 'aluminum5052', 'aluminum6061'] as const) {
        for (const bendAngle of [30, 90, 135]) {
          const r = springback({ material, thickness: 1.5, bendRadius: 10, bendAngle });
          expect(r.overbendExceeds180).toBe(false);
        }
      }
    });
  });

  describe('radiusBelow2T disclosure', () => {
    // The cited validity is R_i > 2T (neutral axis at mid-thickness), so equality is
    // already outside it. Pinned on both sides of the boundary at t=2 → 2T=4.
    it('true at exactly R = 2T and below (tight bends still compute, disclosed)', () => {
      const atBoundary = springback({ material: 'mildSteel', thickness: 2, bendRadius: 4, bendAngle: 90 });
      expect(atBoundary.radiusBelow2T).toBe(true);

      const tight = springback({ material: 'mildSteel', thickness: 2, bendRadius: 2, bendAngle: 90 });
      expect(tight.radiusBelow2T).toBe(true);
      expect(tight.springbackFactor).toBeGreaterThan(0); // still a genuine result
    });

    it('false just above R = 2T', () => {
      const r = springback({ material: 'mildSteel', thickness: 2, bendRadius: 4.01, bendAngle: 90 });
      expect(r.radiusBelow2T).toBe(false);
    });

    it('independent of overbendExceeds180 (both flags carry separate meanings)', () => {
      // Tight bend, small target: below 2T but easily achievable.
      const tightOnly = springback({ material: 'mildSteel', thickness: 2, bendRadius: 3, bendAngle: 90 });
      expect(tightOnly.radiusBelow2T).toBe(true);
      expect(tightOnly.overbendExceeds180).toBe(false);

      // Thin sheet, large radius, target near 180°: achievability fails, geometry valid.
      const overbendOnly = springback({ material: 'mildSteel', thickness: 0.5, bendRadius: 10, bendAngle: 175 });
      expect(overbendOnly.radiusBelow2T).toBe(false);
      expect(overbendOnly.overbendExceeds180).toBe(true);
    });
  });

  describe('model domain x = Y·R_i/(E·T) < 0.5 (elastic limit)', () => {
    // Ks = 4x³−3x+1 = (x+1)(2x−1)² has a double root at x = 0.5, which is exactly the
    // fully-elastic condition (max bending strain T/2R ≤ yield strain Y/E). At the root the
    // implementation used to return Infinity; past it, Ks climbs again and turns negative
    // springback out of thin air (x = 1 → Ks = 2). ISSUE-20260714.

    it('throws at exactly x = 0.5 (mild steel, t=0.5, R=200 → formerly Infinity)', () => {
      // x = 250·200 / (200000·0.5) = 0.5 exactly
      expect(() => springback({ material: 'mildSteel', thickness: 0.5, bendRadius: 200, bendAngle: 90 }))
        .toThrow(RangeError);
      expect(() => springback({ material: 'mildSteel', thickness: 0.5, bendRadius: 200, bendAngle: 90 }))
        .toThrow(/fully elastic/);
    });

    it('throws past the singularity where Ks > 1 gave negative springback (x = 1.0)', () => {
      // x = 250·400 / (200000·0.5) = 1.0 → formerly Ks = 2, springbackAngle = −45°
      expect(() => springback({ material: 'mildSteel', thickness: 0.5, bendRadius: 400, bendAngle: 90 }))
        .toThrow(RangeError);
    });

    it('throws for presets and custom materials alike', () => {
      // aluminum5052: x = 193·91 / (70000·0.5) = 0.5017…
      expect(() => springback({ material: 'aluminum5052', thickness: 0.5, bendRadius: 91, bendAngle: 90 }))
        .toThrow(RangeError);
      // custom spring steel: x = 1200·100 / (200000·1) = 0.6
      expect(() => springback({
        material: 'custom', thickness: 1, bendRadius: 100, bendAngle: 90,
        yieldStrength: 1200, elasticModulus: 200,
      })).toThrow(RangeError);
    });

    it('just inside the domain still returns finite values (x = 0.4975)', () => {
      // x = 250·199 / (200000·0.5) = 0.4975 → Ks = (x+1)(2x−1)² = 0.0000374…
      // Note: at 4 dp the rounded springbackFactor collapses to 0 this close to the
      // boundary; the unrounded value is positive and every field stays finite.
      const r = springback({ material: 'mildSteel', thickness: 0.5, bendRadius: 199, bendAngle: 90 });

      const x = (250 * 199) / (200 * 1000 * 0.5);
      const ks = 4 * x ** 3 - 3 * x + 1;
      expect(r.springbackFactor).toBeCloseTo(ks, 4);
      expect(r.springbackFactor).toBeGreaterThanOrEqual(0);
      for (const v of Object.values(r).filter((v): v is number => typeof v === 'number')) {
        expect(Number.isFinite(v)).toBe(true);
      }
    });

    it('holds the physical invariants (0 < Ks ≤ 1, springbackAngle ≥ 0) across the domain', () => {
      // mildSteel t=0.5: x = R/400 → sweep R toward the boundary at R = 200, staying
      // where Ks is still representable at 4 dp (R = 195 → x = 0.4875, Ks ≈ 0.0009).
      for (const bendRadius of [1, 50, 100, 150, 190, 195]) {
        const r = springback({ material: 'mildSteel', thickness: 0.5, bendRadius, bendAngle: 90 });
        expect(r.springbackFactor).toBeGreaterThan(0);
        expect(r.springbackFactor).toBeLessThanOrEqual(1);
        expect(r.springbackAngle).toBeGreaterThanOrEqual(0);
        expect(r.finalRadius).toBeGreaterThanOrEqual(bendRadius);
      }
    });
  });
});
