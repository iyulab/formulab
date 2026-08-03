import { describe, it, expect } from 'vitest';
import { tolerance, ISO286_SIZE_RANGES } from './tolerance.js';

describe('tolerance', () => {
  describe('H basis hole tolerances', () => {
    it('should calculate H7 tolerance for 25mm', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 7,
      });

      expect(result).not.toBeNull();
      expect(result!.lowerDeviation).toBe(0);
      expect(result!.upperDeviation).toBeGreaterThan(0);
    });

    it('should calculate H7 tolerance for 50mm', () => {
      const result = tolerance({
        nominalSize: 50,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 7,
      });

      expect(result).not.toBeNull();
      expect(result!.lowerDeviation).toBe(0);
    });
  });

  describe('h basis shaft tolerances', () => {
    it('should calculate h6 tolerance for 25mm', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'shaft',
        deviationLetter: 'h',
        itGrade: 6,
      });

      expect(result).not.toBeNull();
      expect(result!.upperDeviation).toBe(0);
      expect(result!.lowerDeviation).toBeLessThan(0);
    });
  });

  describe('clearance fit tolerances', () => {
    it('should calculate f7 shaft tolerance', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'shaft',
        deviationLetter: 'f',
        itGrade: 7,
      });

      expect(result).not.toBeNull();
      expect(result!.upperDeviation).toBeLessThan(0); // Clearance fit
    });

    it('should calculate g6 shaft tolerance', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'shaft',
        deviationLetter: 'g',
        itGrade: 6,
      });

      expect(result).not.toBeNull();
      expect(result!.upperDeviation).toBeLessThan(0);
    });
  });

  describe('interference fit tolerances', () => {
    it('should calculate p6 shaft tolerance', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'shaft',
        deviationLetter: 'p',
        itGrade: 6,
      });

      expect(result).not.toBeNull();
      expect(result!.lowerDeviation).toBeGreaterThan(0); // Interference fit
    });
  });

  describe('symmetric tolerance (js)', () => {
    it('should calculate js7 symmetric tolerance', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'shaft',
        deviationLetter: 'js',
        itGrade: 7,
      });

      expect(result).not.toBeNull();
      // Symmetric: upper = +T/2, lower = -T/2 (may differ slightly due to rounding)
      expect(Math.abs(result!.upperDeviation + result!.lowerDeviation)).toBeLessThan(0.2);
    });
  });

  describe('size limits calculation', () => {
    it('should calculate max and min size', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 7,
      });

      expect(result).not.toBeNull();
      expect(result!.minSize).toBe(25); // H basis, lower dev = 0
      expect(result!.maxSize).toBeGreaterThan(25);
    });

    it('should calculate tolerance band width', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 7,
      });

      expect(result).not.toBeNull();
      expect(result!.toleranceBand).toBeCloseTo(
        Math.abs(result!.upperDeviation - result!.lowerDeviation),
        1
      );
    });
  });

  describe('IT grade variations', () => {
    it('should have tighter tolerance for lower IT grade', () => {
      const it6 = tolerance({
        nominalSize: 25,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 6,
      });

      const it10 = tolerance({
        nominalSize: 25,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 10,
      });

      expect(it6!.toleranceBand).toBeLessThan(it10!.toleranceBand);
    });
  });

  describe('edge cases', () => {
    it('should throw for size out of range', () => {
      expect(() => tolerance({
        nominalSize: 500, // Beyond 400mm
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 7,
      })).toThrow(RangeError);
    });

    it('should throw for invalid IT grade', () => {
      expect(() => tolerance({
        nominalSize: 25,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 3, // Below IT5
      })).toThrow(RangeError);
    });

    it('should throw for invalid deviation letter', () => {
      expect(() => tolerance({
        nominalSize: 25,
        fitType: 'hole',
        deviationLetter: 'x', // Invalid
        itGrade: 7,
      })).toThrow(RangeError);
    });
  });

  /**
   * The exported ranges exist so a caller can enumerate them instead of restating them.
   * That only holds if they describe the same sizes the function actually accepts, so
   * these check the two against each other rather than against a copied list.
   */
  describe('ISO286_SIZE_RANGES', () => {
    it('covers a contiguous span with no gap or overlap between ranges', () => {
      for (let i = 1; i < ISO286_SIZE_RANGES.length; i++) {
        expect(ISO286_SIZE_RANGES[i].over).toBe(ISO286_SIZE_RANGES[i - 1].upTo);
      }
    });

    it('accepts every upper bound it advertises', () => {
      for (const { upTo } of ISO286_SIZE_RANGES) {
        expect(() => tolerance({ nominalSize: upTo, fitType: 'hole', deviationLetter: 'H', itGrade: 7 })).not.toThrow();
      }
    });

    it('rejects sizes past the last range, so the advertised span is the real one', () => {
      const last = ISO286_SIZE_RANGES[ISO286_SIZE_RANGES.length - 1];
      expect(() => tolerance({ nominalSize: last.upTo, fitType: 'hole', deviationLetter: 'H', itGrade: 7 })).not.toThrow();
      expect(() => tolerance({ nominalSize: last.upTo + 0.1, fitType: 'hole', deviationLetter: 'H', itGrade: 7 }))
        .toThrow(RangeError);
    });

    it('gives every range a distinct grade, so no two collapse onto one lookup', () => {
      const bands = ISO286_SIZE_RANGES.map(({ upTo }) =>
        tolerance({ nominalSize: upTo, fitType: 'hole', deviationLetter: 'H', itGrade: 7 }).toleranceBand);
      expect(new Set(bands).size).toBe(bands.length);
    });
  });

  describe('size range boundaries', () => {
    it('should handle small size (1mm)', () => {
      const result = tolerance({
        nominalSize: 1,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 7,
      });

      expect(result).not.toBeNull();
    });

    it('should handle size at boundary (18mm)', () => {
      const result = tolerance({
        nominalSize: 18,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 7,
      });

      expect(result).not.toBeNull();
    });

    it('should handle large size (300mm)', () => {
      const result = tolerance({
        nominalSize: 300,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 7,
      });

      expect(result).not.toBeNull();
    });
  });

  /**
   * Golden values transcribed from the ISO 286-2 limit deviation tables, not produced by
   * this implementation. They are asserted exactly: the standard tolerance grade is read
   * from the tabulated values, so there is no rounding gap left to absorb. An allowance
   * here would only hide the next drift.
   *
   * These exist because the hole side of the letters above H was previously computed by
   * taking the absolute value of the shaft fundamental deviation. For letters a-h that
   * happens to be right, so every test in the suite passed; for k, m, n and p it placed
   * the zone on the wrong side of nominal and dropped the ISO 286-1 delta term. The
   * output stayed a plausible-looking pair of micrometre figures, which is why nothing
   * downstream could notice. A tolerance table is only worth having if it agrees with
   * the table.
   */
  /**
   * The standard tolerance grade itself, read off an H hole where the band is the grade.
   *
   * Every cell here is one the tolerance-unit formula gets wrong, which is the point: the
   * formula is what the published grades were derived from, but the standard rounds each
   * derived value to a preferred one, and rounding it back does not recover the table.
   * At 6-10 the formula gives IT7 = 14.4, which rounds to 14 while the table reads 15 --
   * so "compute and round" is not a repair, only the table is.
   */
  describe('standard tolerance grades against the ISO 286-1 table', () => {
    const cases: Array<[string, number, number, number]> = [
      // label,   nominal, grade, tabulated grade in um
      ['6-10 IT7', 8, 7, 15],
      ['18-30 IT7', 25, 7, 21],
      ['30-50 IT6', 40, 6, 16],
      ['50-80 IT6', 60, 6, 19],
      ['80-120 IT8', 100, 8, 54],
      ['120-180 IT9', 150, 9, 100],
      ['180-250 IT11', 200, 11, 290],
      ['315-400 IT14', 350, 14, 1400],
      ['0-3 IT5', 2, 5, 4],
    ];

    for (const [label, nominalSize, itGrade, grade] of cases) {
      it(`reads ${label} from the table`, () => {
        const r = tolerance({ nominalSize, fitType: 'hole', deviationLetter: 'H', itGrade });

        expect(r.toleranceBand).toBe(grade);
        expect(r.upperDeviation).toBe(grade);
      });
    }

    it('grows monotonically with the grade and with the size', () => {
      const band = (nominalSize: number, itGrade: number) =>
        tolerance({ nominalSize, fitType: 'hole', deviationLetter: 'H', itGrade }).toleranceBand;

      for (const nominalSize of [2, 25, 100, 350]) {
        for (let g = 5; g < 14; g++) {
          expect(band(nominalSize, g)).toBeLessThan(band(nominalSize, g + 1));
        }
      }
      for (const g of [5, 7, 11, 14]) {
        for (const [smaller, larger] of [[2, 25], [25, 100], [100, 350]]) {
          expect(band(smaller, g)).toBeLessThan(band(larger, g));
        }
      }
    });
  });

  describe('hole deviations against the ISO 286-2 table', () => {
    const cases: Array<[string, number, string, number, number, number]> = [
      // label,        nominal, letter, grade, ISO lower, ISO upper
      ['18-30 H7', 25, 'H', 7, 0, 21],
      ['18-30 G7', 25, 'G', 7, 7, 28],
      ['18-30 F8', 25, 'F', 8, 20, 53],
      ['18-30 K7', 25, 'K', 7, -15, 6],
      ['18-30 M7', 25, 'M', 7, -21, 0],
      ['18-30 N7', 25, 'N', 7, -28, -7],
      ['18-30 P7', 25, 'P', 7, -35, -14],
      ['6-10 K7', 8, 'K', 7, -10, 5],
      ['6-10 N7', 8, 'N', 7, -19, -4],
      ['6-10 P7', 8, 'P', 7, -24, -9],
      // The finest grade offered. Its deviation term needs the grade one step finer,
      // which is below the offered range -- when that row is missing the term silently
      // drops to zero and the whole zone shifts by it.
      ['18-30 K5', 25, 'K', 5, -8, 1],
      ['18-30 M5', 25, 'M', 5, -14, -5],
      ['18-30 N5', 25, 'N', 5, -21, -12],
      ['18-30 P5', 25, 'P', 5, -28, -19],
    ];

    for (const [label, nominalSize, deviationLetter, itGrade, lower, upper] of cases) {
      it(`matches the table for ${label}`, () => {
        const r = tolerance({ nominalSize, fitType: 'hole', deviationLetter, itGrade });

        expect(r.lowerDeviation).toBe(lower);
        expect(r.upperDeviation).toBe(upper);
      });
    }

    // The letters above H put the hole zone at or below nominal; the letters at or below
    // H put it at or above. Stating it as a structural rule catches a sign regression in
    // a letter that has no transcribed row above.
    it('places the zone on the side of nominal the letter implies', () => {
      for (const letter of ['D', 'E', 'F', 'G', 'H']) {
        const r = tolerance({ nominalSize: 25, fitType: 'hole', deviationLetter: letter, itGrade: 7 });
        expect(r.lowerDeviation).toBeGreaterThanOrEqual(0);
      }
      for (const letter of ['K', 'M', 'N', 'P']) {
        const r = tolerance({ nominalSize: 25, fitType: 'hole', deviationLetter: letter, itGrade: 7 });
        expect(r.upperDeviation).toBeLessThanOrEqual(6.1); // K7 is the least negative of the four
        expect(r.lowerDeviation).toBeLessThan(0);
      }
    });
  });
});
