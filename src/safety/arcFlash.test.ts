import { describe, it, expect } from 'vitest';
import { arcFlash } from './arcFlash.js';
import type { ArcFlashInput } from './types.js';

/**
 * Golden case: J. Phillips, "Arc Flash Calculation Guide" (Brainfiller), IEEE 1584-2002 worked
 * example — 480 V panel, 30 kA bolted, 25 mm gap, solidly grounded, 1 cycle (0.0167 s) breaker,
 * 18 in (457.2 mm) working distance. Published: Ia 16.761 kA, En 4.82059, Ei 0.96910 cal/cm²
 * (4.05473 J/cm²), DB 400.9 mm at EB = 5 J/cm².
 * (The guide multiplies lg Ia by 1.0811; the standard's 1.081 moves En by 0.03 %. Its printed DB does
 * not reproduce from its own step values — 7,443.14 × 0.0835 × 30.2541 = 18,802.98, and
 * 18,802.98^(1/1.641) = 402.4 mm — so the boundary is checked against the formula on the published En.)
 */
const PHILLIPS: ArcFlashInput = {
  voltage: 480,
  boltedFaultCurrent: 30,
  workingDistance: 457.2,
  faultClearingTime: 0.0167,
  gapBetweenConductors: 25,
  equipment: 'panel',
  grounding: 'grounded',
};

describe('arcFlash', () => {
  describe('IEEE 1584-2002 worked example (Phillips)', () => {
    const r = arcFlash(PHILLIPS);

    it('arcing current includes K = −0.097 for a box configuration', () => {
      expect(r.arcCurrent).toBeCloseTo(16.761, 3);
    });

    it('normalized incident energy uses K1 = −0.555 and K2 = −0.113 (grounded)', () => {
      expect(r.normalizedIncidentEnergy).toBeCloseTo(4.82, 2);
    });

    it('incident energy uses Cf = 1.5 and x = 1.641 for a low-voltage panel', () => {
      expect(r.distanceExponent).toBe(1.641);
      expect(r.incidentEnergy).toBeCloseTo(0.97, 2); // published 0.96910 cal/cm²
      expect(r.ppeCategory).toBe(0);
      expect(r.hazardLevel).toBe('safe');
    });

    it('arc flash boundary is [Cf × En × (t/0.2) × 610^x / 1.2]^(1/x) on the published En', () => {
      const fromPublishedEn = Math.pow((1.5 * 4.82059 * (0.0167 / 0.2) * Math.pow(610, 1.641)) / 1.2, 1 / 1.641);
      expect(Math.abs(r.arcFlashBoundary - fromPublishedEn)).toBeLessThanOrEqual(0.6);
    });

    it('the same case written out literally (also the fixture for check:nonfinite-outputs)', () => {
      const literal = arcFlash({
        voltage: 480,
        boltedFaultCurrent: 30,
        workingDistance: 457.2,
        faultClearingTime: 0.0167,
        gapBetweenConductors: 25,
        equipment: 'panel',
        grounding: 'grounded',
      });
      expect(literal).toEqual(r);
    });

    it('reports 85 % of the arcing current below 1 kV and names the edition', () => {
      expect(r.reducedArcCurrent).toBeCloseTo(0.85 * 16.761, 2);
      expect(r.standard).toBe('IEEE 1584-2002');
    });
  });

  describe('Table 4 distance exponents', () => {
    it.each([
      ['open', 480, 2.0],
      ['switchgear', 480, 1.473],
      ['mcc', 480, 1.641],
      ['panel', 480, 1.641],
      ['cable', 480, 2.0],
      ['open', 4160, 2.0],
      ['switchgear', 4160, 0.973],
      ['cable', 4160, 2.0],
    ] as const)('%s at %i V → x = %f', (equipment, voltage, x) => {
      expect(arcFlash({ ...PHILLIPS, equipment, voltage, gapBetweenConductors: 32 }).distanceExponent).toBe(x);
    });

    it.each(['mcc', 'panel'] as const)('%s above 1 kV is outside the model', (equipment) => {
      expect(() => arcFlash({ ...PHILLIPS, equipment, voltage: 4160 })).toThrow(RangeError);
    });
  });

  describe('coefficients', () => {
    it('K2: a grounded system gives 10^−0.113 of the ungrounded normalized energy', () => {
      const g = arcFlash({ ...PHILLIPS, grounding: 'grounded' });
      const u = arcFlash({ ...PHILLIPS, grounding: 'ungrounded' });
      expect(g.normalizedIncidentEnergy / u.normalizedIncidentEnergy).toBeCloseTo(Math.pow(10, -0.113), 3);
      expect(g.arcCurrent).toBe(u.arcCurrent);
    });

    it('K: open configuration arcing current is 10^(−0.153+0.097) of the box value below 1 kV', () => {
      // switchgear and cable share x only with themselves, so compare box vs open through Ia alone
      const box = arcFlash({ ...PHILLIPS, equipment: 'panel' });
      const open = arcFlash({ ...PHILLIPS, equipment: 'open' });
      expect(open.arcCurrent / box.arcCurrent).toBeCloseTo(Math.pow(10, -0.153 + 0.097), 2);
    });

    it('medium voltage arcing current is lg Ia = 0.00402 + 0.983 lg Ibf, independent of enclosure', () => {
      const r = arcFlash({ ...PHILLIPS, voltage: 4160, equipment: 'switchgear', gapBetweenConductors: 104 });
      expect(r.arcCurrent).toBeCloseTo(Math.pow(10, 0.00402 + 0.983 * Math.log10(30)), 3);
      expect(r.reducedArcCurrent).toBeUndefined();
    });

    it('Cf is 1.5 at 1 kV and 1.0 just above it (voltage class, not enclosure)', () => {
      const base = { ...PHILLIPS, equipment: 'open' as const, workingDistance: 610, faultClearingTime: 0.2 };
      const at = arcFlash({ ...base, voltage: 1000 });
      expect(at.incidentEnergy).toBeCloseTo(1.5 * at.normalizedIncidentEnergy, 1);
      const above = arcFlash({ ...base, voltage: 1001 });
      expect(above.incidentEnergy).toBeCloseTo(above.normalizedIncidentEnergy, 1);
    });

    it('at 610 mm and 0.2 s the incident energy is Cf × En whatever x is', () => {
      const r = arcFlash({ ...PHILLIPS, equipment: 'switchgear', workingDistance: 610, faultClearingTime: 0.2 });
      expect(r.incidentEnergy).toBeCloseTo(1.5 * r.normalizedIncidentEnergy, 1);
    });
  });

  describe('scaling', () => {
    it('energy is linear in clearing time', () => {
      const fast = arcFlash({ ...PHILLIPS, faultClearingTime: 0.1 });
      const slow = arcFlash({ ...PHILLIPS, faultClearingTime: 0.5 });
      expect(slow.incidentEnergy / fast.incidentEnergy).toBeCloseTo(5, 1);
    });

    it('energy falls with distance as (610/D)^x', () => {
      const near = arcFlash({ ...PHILLIPS, workingDistance: 455 });
      const far = arcFlash({ ...PHILLIPS, workingDistance: 910 });
      expect(near.incidentEnergy / far.incidentEnergy).toBeCloseTo(Math.pow(2, 1.641), 1);
    });
  });

  describe('PPE bands', () => {
    it('category 0 and safe at E ≤ 1.2 cal/cm²', () => {
      const r = arcFlash({ ...PHILLIPS, voltage: 208, boltedFaultCurrent: 3, workingDistance: 610, faultClearingTime: 0.02, equipment: 'open' });
      expect(r.incidentEnergy).toBeLessThanOrEqual(1.2);
      expect(r.ppeCategory).toBe(0);
      expect(r.hazardLevel).toBe('safe');
      expect(r.requiredPPE).toContain('No PPE');
    });

    it('category 4 and extreme beyond 40 cal/cm²', () => {
      const r = arcFlash({ ...PHILLIPS, boltedFaultCurrent: 100, faultClearingTime: 2, workingDistance: 300, equipment: 'switchgear' });
      expect(r.incidentEnergy).toBeGreaterThan(40);
      expect(r.ppeCategory).toBe(4);
      expect(r.hazardLevel).toBe('extreme');
    });
  });

  describe('input validation', () => {
    it.each([
      ['voltage', { voltage: 0 }],
      ['boltedFaultCurrent', { boltedFaultCurrent: 0 }],
      ['workingDistance', { workingDistance: 0 }],
      ['faultClearingTime', { faultClearingTime: 0 }],
      ['gapBetweenConductors', { gapBetweenConductors: 0 }],
    ])('throws RangeError for non-positive %s', (_label, override) => {
      expect(() => arcFlash({ ...PHILLIPS, ...override })).toThrow(RangeError);
    });

    it.each([
      ['voltage below 208 V', { voltage: 207 }],
      ['voltage above 15 kV', { voltage: 15001 }],
      ['bolted fault below 0.7 kA', { boltedFaultCurrent: 0.69 }],
      ['bolted fault above 106 kA', { boltedFaultCurrent: 106.1 }],
      ['gap below 13 mm', { gapBetweenConductors: 12 }],
      ['gap above 152 mm', { gapBetweenConductors: 153 }],
    ])('throws RangeError for %s (outside the fitted model)', (_label, override) => {
      expect(() => arcFlash({ ...PHILLIPS, ...override })).toThrow(RangeError);
    });

    it.each([
      ['208 V', { voltage: 208 }],
      ['15 kV', { voltage: 15000, equipment: 'switchgear' as const, gapBetweenConductors: 152 }],
      ['0.7 kA', { boltedFaultCurrent: 0.7 }],
      ['106 kA', { boltedFaultCurrent: 106 }],
      ['13 mm', { gapBetweenConductors: 13 }],
    ])('accepts the range boundary %s', (_label, override) => {
      expect(() => arcFlash({ ...PHILLIPS, ...override })).not.toThrow();
    });
  });
});
