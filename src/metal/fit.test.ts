import { describe, it, expect } from 'vitest';
import { fit } from './fit.js';

/**
 * Golden values are transcribed from the ISO 286-2 limit-deviation tables, not derived
 * from this implementation. Deriving them from the code under test would only prove the
 * code agrees with itself.
 *
 * These once carried a sub-micrometre allowance, because the underlying `tolerance()`
 * derived the standard tolerance grade from the ISO 286-1 tolerance unit rather than
 * reading the tabulated grade, and the two disagree by up to about 0.6 um. The grades
 * are now read from the table, so the allowance is gone and every figure below is
 * asserted exactly. Clearance limits are whole micrometres in the standard; if one of
 * these ever needs an allowance again, the grade lookup has regressed.
 */

describe('fit', () => {
  describe('clearance fit — H7/g6, the reference running fit', () => {
    // ISO 286-2, nominal 18-30 mm: H7 = 0/+21 um, g6 = -7/-20 um.
    // Tightest pairing 0 - (-7) = +7 um, loosest +21 - (-20) = +41 um.
    it('reproduces the tabulated clearance range at 25 mm', () => {
      const r = fit({ nominalSize: 25, holeDeviation: 'H', holeGrade: 7, shaftDeviation: 'g', shaftGrade: 6 });

      expect(r.minClearance).toBe(7);
      expect(r.maxClearance).toBe(41);
      expect(r.fitClass).toBe('clearance');
      expect(r.designation).toBe('25 H7/g6');
    });

    // ISO 286-2, nominal 6-10 mm: H7 = 0/+15 um, g6 = -5/-14 um -> +5 .. +29 um.
    it('reproduces the tabulated clearance range at 8 mm', () => {
      const r = fit({ nominalSize: 8, holeDeviation: 'H', holeGrade: 7, shaftDeviation: 'g', shaftGrade: 6 });

      expect(r.minClearance).toBe(5);
      expect(r.maxClearance).toBe(29);
      expect(r.fitClass).toBe('clearance');
    });
  });

  describe('interference fit — H7/p6', () => {
    // ISO 286-2, nominal 18-30 mm: H7 = 0/+21 um, p6 = +22/+35 um.
    // Tightest pairing 0 - 35 = -35 um, loosest +21 - 22 = -1 um. Both negative:
    // the shaft is larger than the hole under every pairing, so this is interference.
    it('reports negative clearance across the whole range at 25 mm', () => {
      const r = fit({ nominalSize: 25, holeDeviation: 'H', holeGrade: 7, shaftDeviation: 'p', shaftGrade: 6 });

      expect(r.minClearance).toBe(-35);
      expect(r.maxClearance).toBe(-1);
      expect(r.fitClass).toBe('interference');
    });
  });

  describe('transition fit — H7/k6', () => {
    // ISO 286-2, nominal 18-30 mm: H7 = 0/+21 um, k6 = +2/+15 um.
    // Tightest pairing 0 - 15 = -15 um (interference), loosest +21 - 2 = +19 um
    // (clearance). The sign changes inside the range, which is what makes it a
    // transition fit -- the outcome depends on where each part lands in its own zone.
    it('straddles zero at 25 mm', () => {
      const r = fit({ nominalSize: 25, holeDeviation: 'H', holeGrade: 7, shaftDeviation: 'k', shaftGrade: 6 });

      expect(r.minClearance).toBe(-15);
      expect(r.maxClearance).toBe(19);
      expect(r.fitClass).toBe('transition');
    });
  });

  describe('classification boundaries', () => {
    // H7/h6 is the limiting case of a clearance fit: the tightest pairing is exactly
    // zero (largest shaft = nominal = smallest hole). ISO 286-1 counts a zero-gap
    // pairing as clearance, so this pins the >= rather than > in the classifier.
    it('treats a zero tightest clearance as a clearance fit', () => {
      const r = fit({ nominalSize: 25, holeDeviation: 'H', holeGrade: 7, shaftDeviation: 'h', shaftGrade: 6 });

      expect(r.minClearance).toBe(0);
      expect(r.fitClass).toBe('clearance');
    });
  });

  describe('composition invariants', () => {
    it('exposes both member zones so callers need not recompute them', () => {
      const r = fit({ nominalSize: 50, holeDeviation: 'H', holeGrade: 7, shaftDeviation: 'g', shaftGrade: 6 });

      expect(r.hole.designation).toBe('50 H7');
      expect(r.shaft.designation).toBe('50 g6');
      // The extremes must agree with the member zones they were derived from; a caller
      // drawing the pair from `hole`/`shaft` must not be able to reach a different answer.
      expect(r.minClearance).toBeCloseTo(r.hole.lowerDeviation - r.shaft.upperDeviation, 5);
      expect(r.maxClearance).toBeCloseTo(r.hole.upperDeviation - r.shaft.lowerDeviation, 5);
    });

    it('keeps the loosest pairing at or above the tightest one', () => {
      for (const size of [8, 25, 50, 100]) {
        for (const letter of ['g', 'h', 'k', 'p']) {
          const r = fit({ nominalSize: size, holeDeviation: 'H', holeGrade: 7, shaftDeviation: letter, shaftGrade: 6 });
          expect(r.maxClearance).toBeGreaterThanOrEqual(r.minClearance);
        }
      }
    });
  });

  describe('input validation', () => {
    it('rejects a nominal size outside the tabulated ranges', () => {
      expect(() => fit({ nominalSize: 5000, holeDeviation: 'H', holeGrade: 7, shaftDeviation: 'g', shaftGrade: 6 }))
        .toThrow(RangeError);
    });

    it('rejects an unknown IT grade', () => {
      expect(() => fit({ nominalSize: 25, holeDeviation: 'H', holeGrade: 99, shaftDeviation: 'g', shaftGrade: 6 }))
        .toThrow(RangeError);
    });

    it('rejects an unknown deviation letter', () => {
      expect(() => fit({ nominalSize: 25, holeDeviation: 'H', holeGrade: 7, shaftDeviation: 'zz', shaftGrade: 6 }))
        .toThrow(RangeError);
    });
  });
});
