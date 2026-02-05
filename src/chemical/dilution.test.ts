import { describe, it, expect } from 'vitest';
import { dilution } from './dilution.js';

describe('dilution', () => {
  describe('solve for c2 (final concentration)', () => {
    it('should calculate c2 correctly', () => {
      // C1V1 = C2V2 → C2 = C1V1/V2
      // 10% * 100mL = C2 * 500mL → C2 = 2%
      const result = dilution({
        solveFor: 'c2',
        c1: 10,
        v1: 100,
        v2: 500,
      });

      expect(result.c2).toBe(2);
      expect(result.c1).toBe(10);
      expect(result.v1).toBe(100);
      expect(result.v2).toBe(500);
    });

    it('should calculate solvent to add', () => {
      const result = dilution({
        solveFor: 'c2',
        c1: 10,
        v1: 100,
        v2: 500,
      });

      // Solvent to add = V2 - V1 = 500 - 100 = 400mL
      expect(result.solventToAdd).toBe(400);
    });

    it('should throw error when v2 is zero', () => {
      expect(() =>
        dilution({
          solveFor: 'c2',
          c1: 10,
          v1: 100,
          v2: 0,
        })
      ).toThrow('Cannot solve for c2: v2 must be non-zero');
    });
  });

  describe('solve for v2 (final volume)', () => {
    it('should calculate v2 correctly', () => {
      // C1V1 = C2V2 → V2 = C1V1/C2
      // 50% * 200mL = 10% * V2 → V2 = 1000mL
      const result = dilution({
        solveFor: 'v2',
        c1: 50,
        v1: 200,
        c2: 10,
      });

      expect(result.v2).toBe(1000);
      expect(result.solventToAdd).toBe(800);
    });

    it('should throw error when c2 is zero', () => {
      expect(() =>
        dilution({
          solveFor: 'v2',
          c1: 50,
          v1: 200,
          c2: 0,
        })
      ).toThrow('Cannot solve for v2: c2 must be non-zero');
    });
  });

  describe('solve for c1 (initial concentration)', () => {
    it('should calculate c1 correctly', () => {
      // C1V1 = C2V2 → C1 = C2V2/V1
      // C1 * 100mL = 5% * 400mL → C1 = 20%
      const result = dilution({
        solveFor: 'c1',
        v1: 100,
        c2: 5,
        v2: 400,
      });

      expect(result.c1).toBe(20);
    });

    it('should throw error when v1 is zero', () => {
      expect(() =>
        dilution({
          solveFor: 'c1',
          v1: 0,
          c2: 5,
          v2: 400,
        })
      ).toThrow('Cannot solve for c1: v1 must be non-zero');
    });
  });

  describe('solve for v1 (initial volume)', () => {
    it('should calculate v1 correctly', () => {
      // C1V1 = C2V2 → V1 = C2V2/C1
      // 30% * V1 = 6% * 500mL → V1 = 100mL
      const result = dilution({
        solveFor: 'v1',
        c1: 30,
        c2: 6,
        v2: 500,
      });

      expect(result.v1).toBe(100);
    });

    it('should throw error when c1 is zero', () => {
      expect(() =>
        dilution({
          solveFor: 'v1',
          c1: 0,
          c2: 6,
          v2: 500,
        })
      ).toThrow('Cannot solve for v1: c1 must be non-zero');
    });
  });

  describe('real-world examples', () => {
    it('should handle saline dilution (0.9% NaCl)', () => {
      // Make 1L of 0.9% saline from 10% stock
      const result = dilution({
        solveFor: 'v1',
        c1: 10,
        c2: 0.9,
        v2: 1000,
      });

      expect(result.v1).toBe(90); // Need 90mL of 10% stock
      expect(result.solventToAdd).toBe(910); // Add 910mL water
    });

    it('should handle acid dilution', () => {
      // Dilute 37% HCl to 1M (~3.65%)
      const result = dilution({
        solveFor: 'v2',
        c1: 37,
        v1: 100,
        c2: 3.65,
      });

      expect(result.v2).toBeCloseTo(1013.7, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle no dilution needed (same concentration)', () => {
      const result = dilution({
        solveFor: 'v2',
        c1: 10,
        v1: 100,
        c2: 10,
      });

      expect(result.v2).toBe(100);
      expect(result.solventToAdd).toBe(0);
    });

    it('should handle concentration increase (evaporation scenario)', () => {
      // Negative solventToAdd means concentration increase
      const result = dilution({
        solveFor: 'c2',
        c1: 10,
        v1: 100,
        v2: 50, // Volume reduced
      });

      expect(result.c2).toBe(20);
      expect(result.solventToAdd).toBe(-50); // Volume decreased
    });
  });
});
