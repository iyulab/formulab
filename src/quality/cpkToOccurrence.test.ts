import { describe, it, expect } from 'vitest';
import { cpkToOccurrence } from './cpkToOccurrence.js';

/**
 * Golden values: the AIAG & VDA FMEA Handbook (2019) alternative PFMEA Occurrence table rates
 * incidents per 1,000 as 10: ≥ 100 · 9: 50 · 8: 20 · 7: 10 · 6: 2 · 5: 0.5 · 4: 0.1 · 3: 0.01 ·
 * 2: < 0.001. The Cpk at each boundary is where 2·Φ(−3·Cpk) equals that rate (computed with an
 * independent erfc, not with the function under test).
 */
const BOUNDARIES: [rate: number, cpk: number, ratingAtOrBelow: number, ratingAbove: number][] = [
  [100, 0.5483, 10, 9],
  [50, 0.6533, 9, 8],
  [20, 0.7754, 8, 7],
  [10, 0.8586, 7, 6],
  [2, 1.0301, 6, 5],
  [0.5, 1.1603, 5, 4],
  [0.1, 1.2969, 4, 3],
  [0.001, 1.6305, 3, 2],
];

describe('cpkToOccurrence', () => {
  describe('ratings at the table boundaries', () => {
    for (const [rate, cpk, below, above] of BOUNDARIES) {
      it(`${rate} per thousand at Cpk ${cpk}: just below → O=${below}, just above → O=${above}`, () => {
        expect(cpkToOccurrence({ cpk: cpk - 0.0002 }).occurrence).toBe(below);
        expect(cpkToOccurrence({ cpk: cpk + 0.0002 }).occurrence).toBe(above);
      });
    }

    it('rates the table gap 0.001–0.01 per thousand as 3, not 2', () => {
      // Cpk 1.55 → 2·Φ(−4.65) ≈ 3.3 ppm = 0.0033 per thousand
      const r = cpkToOccurrence({ cpk: 1.55 });
      expect(r.ppm).toBeGreaterThan(1);
      expect(r.ppm).toBeLessThan(10);
      expect(r.occurrence).toBe(3);
    });
  });

  describe('common capability levels', () => {
    it('Cpk 0 → O=10 (half the parts out on one side alone)', () => {
      expect(cpkToOccurrence({ cpk: 0 }).occurrence).toBe(10);
      expect(cpkToOccurrence({ cpk: 0 }).ppm).toBeCloseTo(1_000_000, -1);
    });

    it('Cpk 1.00 → O=6, ±3σ fallout ≈ 2,700 ppm', () => {
      const r = cpkToOccurrence({ cpk: 1 });
      expect(r.occurrence).toBe(6);
      expect(r.ppm).toBeCloseTo(2699.8, 0);
    });

    it('Cpk 4/3 → O=3, ±4σ fallout ≈ 63 ppm', () => {
      const r = cpkToOccurrence({ cpk: 4 / 3 });
      expect(r.occurrence).toBe(3);
      expect(r.ppm).toBeCloseTo(63.34, 0);
    });

    it('Cpk 1.67 → O=2', () => {
      expect(cpkToOccurrence({ cpk: 1.67 }).occurrence).toBe(2);
    });

    it('Cpk 2.00 → O=2, ±6σ fallout ≈ 0.002 ppm', () => {
      const r = cpkToOccurrence({ cpk: 2 });
      expect(r.occurrence).toBe(2);
      expect(r.ppm).toBeCloseTo(0.00197, 4);
    });

    it('never returns 1 — the handbook keeps it for causes a prevention control rules out', () => {
      expect(cpkToOccurrence({ cpk: 10 }).occurrence).toBe(2);
    });
  });

  describe('output fields', () => {
    it('uses the handbook occurrence categories', () => {
      const byRating = Object.fromEntries(
        [0.1, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2, 1.4, 2].map(cpk => {
          const r = cpkToOccurrence({ cpk });
          return [r.occurrence, r.description];
        }),
      );
      expect(byRating).toEqual({
        10: 'Extremely high', 9: 'Very high', 8: 'Very high', 7: 'High', 6: 'High',
        5: 'Moderate', 4: 'Moderate', 3: 'Low', 2: 'Very low',
      });
    });

    it('states Cpk bands that join without gaps', () => {
      const ranges = [0.1, 0.6, 0.7, 0.8, 0.9, 1.1, 1.2, 1.4, 2].map(cpk => cpkToOccurrence({ cpk }).cpkRange);
      expect(ranges).toEqual([
        '<= 0.55', '0.55 - 0.65', '0.65 - 0.78', '0.78 - 0.86', '0.86 - 1.03',
        '1.03 - 1.16', '1.16 - 1.30', '1.30 - 1.63', '> 1.63',
      ]);
    });

    it('ppm falls as Cpk rises', () => {
      const ppm = [0, 0.5, 1, 1.5, 2].map(cpk => cpkToOccurrence({ cpk }).ppm);
      for (let i = 1; i < ppm.length; i++) expect(ppm[i]).toBeLessThan(ppm[i - 1]);
    });
  });

  describe('validation', () => {
    it('rates a negative Cpk (mean beyond a limit) at the top row, ppm capped at 1e6', () => {
      for (const cpk of [-0.2, -0.5, -3, -1e6]) {
        const r = cpkToOccurrence({ cpk });
        expect(r.occurrence).toBe(10);
        expect(r.description).toBe('Extremely high');
        expect(r.ppm).toBe(1_000_000);
      }
    });

    it('keeps -0 and the top-row boundary on the top row', () => {
      expect(cpkToOccurrence({ cpk: -0 }).occurrence).toBe(10);
      expect(cpkToOccurrence({ cpk: -0 }).ppm).toBe(1_000_000);
    });

    it('should throw for NaN', () => {
      expect(() => cpkToOccurrence({ cpk: NaN })).toThrow(RangeError);
    });

    it('should throw for Infinity', () => {
      expect(() => cpkToOccurrence({ cpk: Infinity })).toThrow(RangeError);
    });
  });
});
