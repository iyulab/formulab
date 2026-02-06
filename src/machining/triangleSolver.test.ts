import { describe, it, expect } from 'vitest';
import { triangleSolver } from './triangleSolver.js';

describe('triangleSolver', () => {
  describe('SSS (three sides)', () => {
    it('should solve 3-4-5 right triangle', () => {
      const result = triangleSolver({ a: 3, b: 4, c: 5 });

      expect(result.A).toBeCloseTo(36.87, 1);
      expect(result.B).toBeCloseTo(53.13, 1);
      expect(result.C).toBeCloseTo(90, 0);
      expect(result.area).toBeCloseTo(6, 1);
      expect(result.perimeter).toBe(12);
    });

    it('should solve equilateral triangle', () => {
      const result = triangleSolver({ a: 10, b: 10, c: 10 });

      expect(result.A).toBeCloseTo(60, 1);
      expect(result.B).toBeCloseTo(60, 1);
      expect(result.C).toBeCloseTo(60, 1);
      // Area = (√3/4) × 10² = 43.301
      expect(result.area).toBeCloseTo(43.301, 0);
    });
  });

  describe('SAS (two sides + included angle)', () => {
    it('should solve with sides a, b and angle C', () => {
      const result = triangleSolver({ a: 5, b: 7, C: 60 });

      // c² = 25 + 49 - 2(5)(7)cos(60°) = 74 - 35 = 39 → c ≈ 6.245
      expect(result.c).toBeCloseTo(6.245, 2);
      expect(result.A + result.B + result.C).toBeCloseTo(180, 1);
    });
  });

  describe('ASA/AAS (two angles + one side)', () => {
    it('should solve with angles A, B and side a', () => {
      const result = triangleSolver({ a: 10, A: 40, B: 60 });

      expect(result.C).toBeCloseTo(80, 1);
      expect(result.b).toBeCloseTo(10 * Math.sin(60 * Math.PI / 180) / Math.sin(40 * Math.PI / 180), 2);
      expect(result.area).toBeGreaterThan(0);
    });

    it('should solve with angles A, C and side c', () => {
      const result = triangleSolver({ c: 8, A: 30, C: 70 });

      expect(result.B).toBeCloseTo(80, 1);
      expect(result.a).toBeCloseTo(8 * Math.sin(30 * Math.PI / 180) / Math.sin(70 * Math.PI / 180), 2);
    });
  });

  describe('SSA (ambiguous case)', () => {
    it('should solve valid SSA case', () => {
      const result = triangleSolver({ a: 10, b: 7, A: 45 });

      expect(result.c).toBeGreaterThan(0);
      expect(result.A + result.B + result.C).toBeCloseTo(180, 1);
    });

    it('should throw for impossible triangle', () => {
      expect(() => triangleSolver({ a: 3, b: 10, A: 80 })).toThrow();
    });
  });

  describe('validation', () => {
    it('should throw for insufficient data', () => {
      expect(() => triangleSolver({ a: 5 })).toThrow('Insufficient');
    });

    it('should calculate perimeter correctly', () => {
      const result = triangleSolver({ a: 3, b: 4, c: 5 });
      expect(result.perimeter).toBe(12);
    });
  });
});
