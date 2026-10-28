import { describe, it, expect } from 'vitest';
import { conformityDecision } from './conformityDecision.js';

// Worked numbers from the standards, not from the implementation:
//  - ILAC-G8:09/2019 Table 1 (with k = 2, so w = r·U = 2r·u): w = U → specific false-accept risk < 2.5 % (Φ(−2) = 2.28 %),
//    w = 1.5U → < 0.16 % (Φ(−3) = 0.135 %), w = 3U → < 1 ppm (Φ(−6)), w = 0.83U → < 5 % (Φ(−1.66) = 4.85 %), w = 0 → 50 %.
//  - JCGM 106:2012 §9 ISO 14253-1 example: w = U = 2u → at most 2.3 % at the acceptance limit.
//  - JCGM 106:2012 Example 1 (speed limit): u = 0.02·v, limit v0 = 100 km/h, z = 3.09 for 99.9 % → threshold 100/(1 − 0.02·3.09) ≈ 107 km/h.
describe('conformityDecision — acceptance limit and risk (ILAC-G8 Table 1)', () => {
  const U = 0.2; // k = 2 → u = 0.1

  it('w = U: a value on the acceptance limit has a false-accept risk of 2.3 % (Φ(−2))', () => {
    const r = conformityDecision({ measured: 9.8, upperLimit: 10, expandedUncertainty: U });
    expect(r.acceptanceUpper).toBe(9.8);
    expect(r.decision).toBe('pass');
    expect(1 - r.conformanceProbability).toBeCloseTo(0.02275, 4);
    expect(1 - r.conformanceProbability).toBeLessThan(0.025);
  });

  it('w = 1.5U: 3σ rule — risk 0.135 %, below the table\'s 0.16 %', () => {
    const r = conformityDecision({ measured: 9.7, upperLimit: 10, expandedUncertainty: U, guardBandFactor: 1.5 });
    expect(r.guardBand).toBeCloseTo(0.3, 9);
    expect(r.acceptanceUpper).toBe(9.7);
    expect(r.decision).toBe('pass');
    expect(1 - r.conformanceProbability).toBeCloseTo(0.00135, 4);
    expect(1 - r.conformanceProbability).toBeLessThan(0.0016);
  });

  it('w = 3U: 6σ rule — risk below 1 ppm', () => {
    const r = conformityDecision({ measured: 9.4, upperLimit: 10, expandedUncertainty: U, guardBandFactor: 3 });
    expect(r.decision).toBe('pass');
    expect(1 - r.conformanceProbability).toBeLessThan(1e-6);
  });

  it('w = 0.83U (ISO 14253-1 style): risk below 5 %', () => {
    const r = conformityDecision({ measured: 10 - 0.166, upperLimit: 10, expandedUncertainty: U, guardBandFactor: 0.83 });
    expect(r.decision).toBe('pass');
    expect(1 - r.conformanceProbability).toBeCloseTo(0.0485, 3);
    expect(1 - r.conformanceProbability).toBeLessThan(0.05);
  });

  it('simple acceptance (w = 0): a value exactly on the limit is 50 % — shared risk', () => {
    const r = conformityDecision({ measured: 10, upperLimit: 10, expandedUncertainty: U, guardBandFactor: 0 });
    expect(r.decision).toBe('pass');
    expect(r.guardBand).toBe(0);
    expect(r.conformanceProbability).toBeCloseTo(0.5, 6);
  });

  it('JCGM 106 Example 1: a 2 % relative uncertainty needs 107 km/h for 99.9 % that the limit of 100 km/h is exceeded', () => {
    const vmax = 100 / (1 - 0.02 * 3.09); // 106.58...
    const r = conformityDecision({ measured: vmax, lowerLimit: 100, expandedUncertainty: 2 * 0.02 * vmax });
    expect(vmax).toBeCloseTo(106.59, 1);
    expect(r.conformanceProbability).toBeCloseTo(0.999, 3);
  });
});

describe('conformityDecision — the four statements (ILAC-G8 §4.2.3, Example 2)', () => {
  const base = { upperLimit: 10, expandedUncertainty: 0.2 };

  it.each([
    [9.7, 'pass'],
    [9.8, 'pass'],      // the acceptance limit itself is inside
    [9.9, 'conditionalPass'],
    [10, 'conditionalPass'], // the tolerance limit itself is still inside the tolerance
    [10.1, 'conditionalFail'],
    [10.2, 'conditionalFail'], // the rejection limit TL + w itself is not beyond it
    [10.3, 'fail'],
  ] as const)('measured %s → %s', (measured, decision) => {
    expect(conformityDecision({ ...base, measured }).decision).toBe(decision);
  });

  it('the binary statement passes only an accepted value', () => {
    expect(conformityDecision({ ...base, measured: 9.7 }).binaryDecision).toBe('pass');
    expect(conformityDecision({ ...base, measured: 9.9 }).binaryDecision).toBe('fail');
    expect(conformityDecision({ ...base, measured: 10.1 }).binaryDecision).toBe('fail');
  });

  it('withinTolerance is the simple-acceptance answer, independent of the guard band', () => {
    expect(conformityDecision({ ...base, measured: 9.9 }).withinTolerance).toBe(true);
    expect(conformityDecision({ ...base, measured: 10.1 }).withinTolerance).toBe(false);
  });

  it('with w = 0 there are no conditional statements', () => {
    for (const measured of [9.99, 10, 10.01]) {
      const d = conformityDecision({ ...base, measured, guardBandFactor: 0 }).decision;
      expect(['pass', 'fail']).toContain(d);
    }
    expect(conformityDecision({ ...base, measured: 10, guardBandFactor: 0 }).decision).toBe('pass');
    expect(conformityDecision({ ...base, measured: 10.0001, guardBandFactor: 0 }).decision).toBe('fail');
  });

  it('the same value passes under one rule and not under a larger guard band', () => {
    expect(conformityDecision({ ...base, measured: 9.85, guardBandFactor: 0.5 }).decision).toBe('pass');
    expect(conformityDecision({ ...base, measured: 9.85, guardBandFactor: 1 }).decision).toBe('conditionalPass');
  });
});

describe('conformityDecision — two-sided tolerance and one lower limit', () => {
  it('guards both limits', () => {
    const base = { lowerLimit: 9, upperLimit: 11, expandedUncertainty: 0.2 };
    expect(conformityDecision({ ...base, measured: 10 }).decision).toBe('pass');
    expect(conformityDecision({ ...base, measured: 9.1 }).decision).toBe('conditionalPass');
    expect(conformityDecision({ ...base, measured: 10.95 }).decision).toBe('conditionalPass');
    expect(conformityDecision({ ...base, measured: 8.9 }).decision).toBe('conditionalFail');
    expect(conformityDecision({ ...base, measured: 8.7 }).decision).toBe('fail');
    expect(conformityDecision({ ...base, measured: 10 }).acceptanceLower).toBe(9.2);
    expect(conformityDecision({ ...base, measured: 10 }).rejectionUpper).toBe(11.2);
  });

  it('a lower limit alone mirrors the upper one and reports no upper limits', () => {
    const r = conformityDecision({ measured: 100.3, lowerLimit: 100, expandedUncertainty: 0.2 });
    expect(r.decision).toBe('pass');
    expect(r.acceptanceLower).toBe(100.2);
    expect(r.acceptanceUpper).toBeNull();
    expect(r.rejectionUpper).toBeNull();
    // Φ((y − LL)/u) with u = 0.1: Φ(3)
    expect(r.conformanceProbability).toBeCloseTo(0.99865, 4);
  });

  it('a two-sided conformance probability is the mass between the limits (JCGM 106 expression (6))', () => {
    // centred, u = 0.5, half-width 1 → Φ(2) − Φ(−2) = 0.9545
    const r = conformityDecision({ measured: 10, lowerLimit: 9, upperLimit: 11, expandedUncertainty: 1 });
    expect(r.standardUncertainty).toBe(0.5);
    expect(r.conformanceProbability).toBeCloseTo(0.9545, 4);
  });

  it('guard bands wider than half the tolerance leave no acceptance interval', () => {
    const r = conformityDecision({ measured: 10, lowerLimit: 9.9, upperLimit: 10.1, expandedUncertainty: 0.3 });
    expect(r.acceptanceIntervalEmpty).toBe(true);
    expect(r.decision).toBe('conditionalPass');
    expect(conformityDecision({ measured: 10, lowerLimit: 9, upperLimit: 11, expandedUncertainty: 0.3 }).acceptanceIntervalEmpty).toBe(false);
  });
});

describe('conformityDecision — edges and refusals', () => {
  it('zero uncertainty is an exact measurement: the guard band vanishes and the probability is 1 or 0', () => {
    const inside = conformityDecision({ measured: 9.99, upperLimit: 10, expandedUncertainty: 0 });
    expect(inside.decision).toBe('pass');
    expect(inside.conformanceProbability).toBe(1);
    const outside = conformityDecision({ measured: 10.01, upperLimit: 10, expandedUncertainty: 0 });
    expect(outside.decision).toBe('fail');
    expect(outside.conformanceProbability).toBe(0);
  });

  it('a different coverage factor changes u, not the guard band', () => {
    const k2 = conformityDecision({ measured: 9.8, upperLimit: 10, expandedUncertainty: 0.2 });
    const k3 = conformityDecision({ measured: 9.8, upperLimit: 10, expandedUncertainty: 0.2, coverageFactor: 3 });
    expect(k3.guardBand).toBe(k2.guardBand);
    expect(k3.standardUncertainty).toBeCloseTo(0.066667, 6);
    expect(k3.conformanceProbability).toBeGreaterThan(k2.conformanceProbability);
  });

  it('refuses a missing tolerance, crossed limits and out-of-range factors with the offending field', () => {
    expect(() => conformityDecision({ measured: 1, expandedUncertainty: 0.1 })).toThrow(expect.objectContaining({ code: 'missing_option' }));
    expect(() => conformityDecision({ measured: 1, lowerLimit: 2, upperLimit: 2, expandedUncertainty: 0.1 }))
      .toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'upperLimit' }));
    expect(() => conformityDecision({ measured: 1, upperLimit: 2, expandedUncertainty: -0.1 }))
      .toThrow(expect.objectContaining({ parameter: 'expandedUncertainty' }));
    expect(() => conformityDecision({ measured: 1, upperLimit: 2, expandedUncertainty: 0.1, coverageFactor: 0 }))
      .toThrow(expect.objectContaining({ parameter: 'coverageFactor' }));
    expect(() => conformityDecision({ measured: 1, upperLimit: 2, expandedUncertainty: 0.1, guardBandFactor: -1 }))
      .toThrow(expect.objectContaining({ parameter: 'guardBandFactor' }));
  });

  it('refuses a non-finite number anywhere', () => {
    expect(() => conformityDecision({ measured: NaN, upperLimit: 2, expandedUncertainty: 0.1 }))
      .toThrow(expect.objectContaining({ code: 'value_not_finite' }));
    expect(() => conformityDecision({ measured: 1, upperLimit: Infinity, expandedUncertainty: 0.1 }))
      .toThrow(expect.objectContaining({ code: 'value_not_finite' }));
  });
});
