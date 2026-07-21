import { describe, it, expect } from 'vitest';
import { columnBuckling } from './columnBuckling.js';

describe('columnBuckling', () => {
  it('matches the Euler formula independently for a pinned-pinned column', () => {
    // Independent anchor: Pcr = pi^2 E I / (KL)^2, K=1.
    // E=200000 MPa, I=1e6 mm^4, L=2000 mm → pi^2 * 200000 * 1e6 / 2000^2 = 493480.22 N.
    // This is hand-derived from the closed form, NOT read back from the function under test.
    const r = columnBuckling({
      youngsModulus: 200000,
      momentOfInertia: 1e6,
      area: 2000,
      length: 2000,
      endCondition: 'pinned-pinned',
      yieldStrength: 250,
    });
    expect(r.criticalLoad).toBeCloseTo(493480.2, 1);
    expect(r.effectiveLengthFactor).toBe(1);
    expect(r.effectiveLength).toBe(2000);
  });

  it('computes a slender (long) column as elastic — Euler valid', () => {
    const r = columnBuckling({
      youngsModulus: 200000,
      momentOfInertia: 5e6,
      area: 5000,
      length: 5000,
      endCondition: 'pinned-pinned',
      yieldStrength: 250,
    });
    expect(r.criticalLoad).toBeCloseTo(394784.2, 1);
    expect(r.criticalStress).toBeCloseTo(78.96, 2);
    expect(r.radiusOfGyration).toBeCloseTo(31.623, 3); // sqrt(5e6/5000) = sqrt(1000)
    expect(r.slendernessRatio).toBeCloseTo(158.11, 2); // 5000 / 31.623
    expect(r.transitionSlenderness).toBeCloseTo(125.66, 2); // pi*sqrt(2*200000/250) = pi*40
    expect(r.yieldLoad).toBe(1250000); // 5000 * 250
    expect(r.isElastic).toBe(true); // slenderness 158.11 >= Cc 125.66
  });

  it('flags a short/stubby column as inelastic — Euler over-predicts (isElastic=false)', () => {
    // Same section, shorter length → slenderness 94.87 < transition 125.66. The raw Euler
    // Pcr (1096.6 kN) exceeds what the column can reach before inelastic buckling/yielding;
    // isElastic=false is the honest guard against silently reporting an unreachable capacity.
    const r = columnBuckling({
      youngsModulus: 200000,
      momentOfInertia: 5e6,
      area: 5000,
      length: 3000,
      endCondition: 'pinned-pinned',
      yieldStrength: 250,
    });
    expect(r.slendernessRatio).toBeCloseTo(94.87, 2);
    expect(r.slendernessRatio).toBeLessThan(r.transitionSlenderness);
    expect(r.isElastic).toBe(false);
    expect(r.criticalLoad).toBeCloseTo(1096622.7, 1); // NOT clamped — honest Euler value
  });

  it('applies the end-condition effective-length factor K', () => {
    const base = { youngsModulus: 200000, momentOfInertia: 5e6, area: 5000, length: 5000, yieldStrength: 250 } as const;
    const pinned = columnBuckling({ ...base, endCondition: 'pinned-pinned' });
    const fixedFixed = columnBuckling({ ...base, endCondition: 'fixed-fixed' });
    const fixedFree = columnBuckling({ ...base, endCondition: 'fixed-free' });
    const fixedPinned = columnBuckling({ ...base, endCondition: 'fixed-pinned' });

    expect(fixedFixed.effectiveLengthFactor).toBe(0.5);
    expect(fixedFree.effectiveLengthFactor).toBe(2.0);
    expect(fixedPinned.effectiveLengthFactor).toBe(0.7);
    // Pcr scales with 1/K^2: fixed-fixed (K=0.5) carries 4x the pinned load, fixed-free (K=2) a quarter.
    expect(fixedFixed.criticalLoad).toBeCloseTo(pinned.criticalLoad * 4, 0);
    expect(fixedFree.criticalLoad).toBeCloseTo(pinned.criticalLoad / 4, 0);
  });

  it('throws RangeError on non-positive inputs', () => {
    const base = { youngsModulus: 200000, momentOfInertia: 5e6, area: 5000, length: 5000, endCondition: 'pinned-pinned' as const, yieldStrength: 250 };
    expect(() => columnBuckling({ ...base, youngsModulus: 0 })).toThrow(RangeError);
    expect(() => columnBuckling({ ...base, momentOfInertia: 0 })).toThrow(RangeError);
    expect(() => columnBuckling({ ...base, area: 0 })).toThrow(RangeError);
    expect(() => columnBuckling({ ...base, length: 0 })).toThrow(RangeError);
    expect(() => columnBuckling({ ...base, yieldStrength: 0 })).toThrow(RangeError);
  });
});
