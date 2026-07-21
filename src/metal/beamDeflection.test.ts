import { describe, it, expect } from 'vitest';
import { beamDeflection, beamDeflectionCurve } from './beamDeflection.js';
import type { BeamDeflectionInput } from './types.js';

// Common section for the hand-derived anchors below:
// E = 200000 MPa, I = 1e6 mm⁴ → EI = 2e11 N·mm²; span L = 1000 mm.
// All δ values are computed independently from the closed forms, NOT read back.
const base = {
  span: 1000,
  youngsModulus: 200000,
  momentOfInertia: 1e6,
  deflectionLimitRatio: 360,
} as const;

describe('beamDeflection', () => {
  it('matches 5wL⁴/384EI for a simply supported uniform load', () => {
    // δ = 5·1·1000⁴ / (384·2e11) = 5e12 / 7.68e13 = 0.0651042 mm
    const r = beamDeflection({ ...base, support: 'simple', loadType: 'uniform', uniformLoad: 1 });
    expect(r.maxDeflection).toBeCloseTo(0.0651, 4);
    expect(r.maxDeflectionLocation).toBe(500); // midspan
    expect(r.allowableDeflection).toBeCloseTo(2.778, 3); // 1000 / 360
    expect(r.isSafe).toBe(true);
  });

  it('matches PL³/48EI for a simply supported central point load', () => {
    // δ = 1000·1000³ / (48·2e11) = 1e12 / 9.6e12 = 0.1041667 mm
    const r = beamDeflection({ ...base, support: 'simple', loadType: 'concentrated', pointLoad: 1000 });
    expect(r.maxDeflection).toBeCloseTo(0.1042, 4);
    expect(r.maxDeflectionLocation).toBe(500);
  });

  it('matches wL⁴/8EI and PL³/3EI for a cantilever (max at the free end)', () => {
    // uniform: δ = 1·1000⁴ / (8·2e11) = 1e12 / 1.6e12 = 0.625 mm
    const u = beamDeflection({ ...base, support: 'cantilever', loadType: 'uniform', uniformLoad: 1 });
    expect(u.maxDeflection).toBeCloseTo(0.625, 4);
    expect(u.maxDeflectionLocation).toBe(1000); // free end
    // point at free end: δ = 1000·1000³ / (3·2e11) = 1e12 / 6e11 = 1.6667 mm
    const p = beamDeflection({ ...base, support: 'cantilever', loadType: 'concentrated', pointLoad: 1000 });
    expect(p.maxDeflection).toBeCloseTo(1.6667, 4);
  });

  it('matches wL⁴/384EI and PL³/192EI for a fixed-fixed beam', () => {
    // uniform: δ = 1·1000⁴ / (384·2e11) = 0.0130208 mm
    const u = beamDeflection({ ...base, support: 'fixed', loadType: 'uniform', uniformLoad: 1 });
    expect(u.maxDeflection).toBeCloseTo(0.013, 4);
    expect(u.maxDeflectionLocation).toBe(500);
    // point at midspan: δ = 1000·1000³ / (192·2e11) = 1e12 / 3.84e13 = 0.0260417 mm
    const p = beamDeflection({ ...base, support: 'fixed', loadType: 'concentrated', pointLoad: 1000 });
    expect(p.maxDeflection).toBeCloseTo(0.026, 4);
  });

  it('superposes uniform + point exactly for a combined load (same location)', () => {
    // simple combined: 0.0651042 (uniform) + 0.1041667 (point) = 0.1692708 mm
    const r = beamDeflection({
      ...base, support: 'simple', loadType: 'combined', uniformLoad: 1, pointLoad: 1000,
    });
    expect(r.maxDeflection).toBeCloseTo(0.1693, 4);
    expect(r.maxDeflectionLocation).toBe(500);
  });

  it('flags a beam that fails the serviceability limit (isSafe=false, ratio>1)', () => {
    // cantilever point load δ=1.6667 mm; allowable = L/1000 = 1.0 mm → ratio 1.667, fails.
    const r = beamDeflection({
      ...base, support: 'cantilever', loadType: 'concentrated', pointLoad: 1000, deflectionLimitRatio: 1000,
    });
    expect(r.allowableDeflection).toBe(1);
    expect(r.deflectionRatio).toBeCloseTo(1.667, 3);
    expect(r.isSafe).toBe(false);
  });

  it('throws RangeError on non-positive span/E/I/ratio', () => {
    const ok: BeamDeflectionInput = { ...base, support: 'simple', loadType: 'uniform', uniformLoad: 1 };
    expect(() => beamDeflection({ ...ok, span: 0 })).toThrow(RangeError);
    expect(() => beamDeflection({ ...ok, youngsModulus: 0 })).toThrow(RangeError);
    expect(() => beamDeflection({ ...ok, momentOfInertia: 0 })).toThrow(RangeError);
    expect(() => beamDeflection({ ...ok, deflectionLimitRatio: 0 })).toThrow(RangeError);
  });

  it('throws RangeError when the load required by the load type is missing', () => {
    expect(() => beamDeflection({ ...base, support: 'simple', loadType: 'uniform' })).toThrow(RangeError);
    expect(() => beamDeflection({ ...base, support: 'simple', loadType: 'concentrated' })).toThrow(RangeError);
    expect(() => beamDeflection({ ...base, support: 'simple', loadType: 'combined', uniformLoad: 1 })).toThrow(RangeError);
  });
});

describe('beamDeflectionCurve', () => {
  it('samples the deflected shape with pinned ends at zero and its peak equal to δ_max', () => {
    const input: BeamDeflectionInput = { ...base, support: 'simple', loadType: 'uniform', uniformLoad: 1 };
    const curve = beamDeflectionCurve(input, 41);
    expect(curve).toHaveLength(41);
    expect(curve[0]).toEqual({ position: 0, deflection: 0 });     // left support
    expect(curve[40].position).toBe(1000);
    expect(curve[40].deflection).toBe(0);                          // right support
    // The sampled peak must equal the reported maximum (no drift between curve and δ_max).
    const peak = Math.max(...curve.map(p => p.deflection));
    expect(peak).toBeCloseTo(beamDeflection(input).maxDeflection, 4);
  });

  it('grows monotonically to the free end for a cantilever', () => {
    const input: BeamDeflectionInput = { ...base, support: 'cantilever', loadType: 'concentrated', pointLoad: 1000 };
    const curve = beamDeflectionCurve(input, 21);
    expect(curve[0].deflection).toBe(0); // fixed end
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].deflection).toBeGreaterThanOrEqual(curve[i - 1].deflection);
    }
    expect(curve[curve.length - 1].deflection).toBeCloseTo(1.6667, 4); // free-end δ_max
  });

  it('throws RangeError on count < 2', () => {
    expect(() =>
      beamDeflectionCurve({ ...base, support: 'simple', loadType: 'uniform', uniformLoad: 1 }, 1),
    ).toThrow(RangeError);
  });
});
