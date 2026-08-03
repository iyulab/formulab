import { describe, it, expect } from 'vitest';
import { tolerance } from './tolerance.js';

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
   * this implementation. They are asserted with a 1 um allowance because the standard
   * tolerance grade here comes from the ISO 286-1 formula while the published table rounds
   * each grade to a whole micrometre.
   *
   * These exist because the hole side of the letters above H was previously computed by
   * taking the absolute value of the shaft fundamental deviation. For letters a-h that
   * happens to be right, so every test in the suite passed; for k, m, n and p it placed
   * the zone on the wrong side of nominal and dropped the ISO 286-1 delta term. The
   * output stayed a plausible-looking pair of micrometre figures, which is why nothing
   * downstream could notice. A tolerance table is only worth having if it agrees with
   * the table.
   */
  describe('hole deviations against the ISO 286-2 table', () => {
    const UM = 1;
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
    ];

    for (const [label, nominalSize, deviationLetter, itGrade, lower, upper] of cases) {
      it(`matches the table for ${label}`, () => {
        const r = tolerance({ nominalSize, fitType: 'hole', deviationLetter, itGrade });

        expect(r.lowerDeviation).toBeGreaterThan(lower - UM);
        expect(r.lowerDeviation).toBeLessThan(lower + UM);
        expect(r.upperDeviation).toBeGreaterThan(upper - UM);
        expect(r.upperDeviation).toBeLessThan(upper + UM);
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
