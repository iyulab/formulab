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
    it('should return null for size out of range', () => {
      const result = tolerance({
        nominalSize: 500, // Beyond 400mm
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 7,
      });

      expect(result).toBeNull();
    });

    it('should return null for invalid IT grade', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'hole',
        deviationLetter: 'H',
        itGrade: 3, // Below IT5
      });

      expect(result).toBeNull();
    });

    it('should return null for invalid deviation letter', () => {
      const result = tolerance({
        nominalSize: 25,
        fitType: 'hole',
        deviationLetter: 'x', // Invalid
        itGrade: 7,
      });

      expect(result).toBeNull();
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
});
