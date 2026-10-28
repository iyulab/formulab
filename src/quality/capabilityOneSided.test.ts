import { describe, it, expect } from 'vitest';
import { cpk } from './cpk.js';
import { ppk } from './ppk.js';
import { cmk } from './cmk.js';
import { normalCDF } from '../math.js';

// A one-sided tolerance has one limit, so only the index of that limit exists (AIAG & VDA SPC manual,
// one-sided tolerance limits). Closed forms: upper-only Cpu = (USL - mean) / 3s, lower-only Cpl = (mean - LSL) / 3s,
// and the within-spec share keeps just the given limit.

describe('one-sided specification', () => {
  describe('cpk', () => {
    it('upper limit only: Cpk is Cpu, the lower side and Cp have no value', () => {
      // Ra <= 0.8, mean 0.5, s 0.1 -> Cpu = 0.3 / 0.3 = 1
      const r = cpk({ usl: 0.8, mean: 0.5, stdDev: 0.1 });
      expect(r.cpu).toBe(1);
      expect(r.cpk).toBe(1);
      expect(r.cpl).toBeNull();
      expect(r.cp).toBeNull();
      expect(r.sigmaLevel).toBe(3);
      expect(r.withinSpecPercent).toBeCloseTo(normalCDF(3) * 100, 3);
    });

    it('lower limit only: Cpk is Cpl, the upper side and Cp have no value', () => {
      // strength >= 90, mean 100, s 2 -> Cpl = 10 / 6
      const r = cpk({ lsl: 90, mean: 100, stdDev: 2 });
      expect(r.cpl).toBeCloseTo(1.6667, 4);
      expect(r.cpk).toBeCloseTo(1.6667, 4);
      expect(r.cpu).toBeNull();
      expect(r.cp).toBeNull();
      expect(r.withinSpecPercent).toBeCloseTo((1 - normalCDF(-5)) * 100, 3);
    });

    it('matches the two-sided result with the other limit out of reach, and needs no made-up limit', () => {
      const oneSided = cpk({ usl: 0.8, mean: 0.5, stdDev: 0.1 });
      const farLower = cpk({ usl: 0.8, lsl: -1e6, mean: 0.5, stdDev: 0.1 });
      expect(oneSided.cpk).toBe(farLower.cpu);
      expect(oneSided.withinSpecPercent).toBeCloseTo(farLower.withinSpecPercent, 4);
    });

    it('a better process (mean further from the one limit) never lowers the index', () => {
      // With a made-up lower limit of 0 the index would fall as the mean dropped below the midpoint.
      const means = [0.6, 0.5, 0.4, 0.3, 0.2];
      const indices = means.map((mean) => cpk({ usl: 0.8, mean, stdDev: 0.1 }).cpk as number);
      for (let i = 1; i < indices.length; i++) expect(indices[i]).toBeGreaterThan(indices[i - 1]);
    });

    it('a mean beyond the only limit is a negative index, not a refusal', () => {
      expect(cpk({ usl: 10, mean: 11, stdDev: 1 }).cpk).toBeCloseTo(-0.3333, 4);
    });

    it('without either limit it refuses with missing_option', () => {
      expect(() => cpk({ mean: 1, stdDev: 1 } as never)).toThrow(
        expect.objectContaining({ code: 'missing_option', parameter: 'usl' }),
      );
    });

    it('zero spread: no index, within-spec share follows the mean against the given limit', () => {
      const inside = cpk({ usl: 10, mean: 9, stdDev: 0 });
      expect([inside.cpk, inside.cpu, inside.cpl, inside.cp, inside.sigmaLevel]).toEqual([null, null, null, null, null]);
      expect(inside.withinSpecPercent).toBe(100);
      expect(cpk({ usl: 10, mean: 11, stdDev: 0 }).withinSpecPercent).toBe(0);
      expect(cpk({ lsl: 10, mean: 9, stdDev: 0 }).withinSpecPercent).toBe(0);
    });

    it('a non-finite single limit is still refused', () => {
      expect(() => cpk({ usl: Infinity, mean: 1, stdDev: 1 })).toThrow(expect.objectContaining({ code: 'value_not_finite' }));
    });
  });

  describe('ppk', () => {
    it('summary input with one limit: Ppk is Ppu or Ppl, Pp has no value', () => {
      const upper = ppk({ usl: 12, mean: 10, stdDev: 0.5 });
      expect(upper.ppk).toBeCloseTo(1.3333, 4);
      expect(upper.ppu).toBeCloseTo(1.3333, 4);
      expect(upper.ppl).toBeNull();
      expect(upper.pp).toBeNull();
      const lower = ppk({ lsl: 8, mean: 10, stdDev: 0.5 });
      expect(lower.ppk).toBeCloseTo(1.3333, 4);
      expect(lower.ppu).toBeNull();
    });

    it('readings with one limit take the overall mean and sample standard deviation', () => {
      // mean 10, sample s = 1 for [9, 10, 11]; Ppu = (13 - 10) / 3 = 1
      const r = ppk({ usl: 13, data: [9, 10, 11] });
      expect(r.ppk).toBe(1);
      expect(r.ppl).toBeNull();
    });

    it('without either limit it refuses with missing_option', () => {
      expect(() => ppk({ mean: 1, stdDev: 1 } as never)).toThrow(expect.objectContaining({ code: 'missing_option' }));
      expect(() => ppk({ data: [1, 2, 3] } as never)).toThrow(expect.objectContaining({ code: 'missing_option' }));
    });
  });

  describe('cmk', () => {
    it('one limit: Cmk is that side, Cm has no value, the 1.67 threshold applies to it', () => {
      // [9, 10, 11]: mean 10, s 1
      const upper = cmk({ usl: 13, measurements: [9, 10, 11] });
      expect(upper.cmk).toBe(1);
      expect(upper.cm).toBeNull();
      expect(upper.isCapable).toBe(false);
      const lower = cmk({ lsl: 4, measurements: [9, 10, 11] });
      expect(lower.cmk).toBe(2);
      expect(lower.isCapable).toBe(true);
    });

    it('without either limit it refuses with missing_option', () => {
      expect(() => cmk({ measurements: [9, 10, 11] } as never)).toThrow(expect.objectContaining({ code: 'missing_option' }));
    });
  });
});
