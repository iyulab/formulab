import { describe, it, expect } from 'vitest';
import { lel } from './lel.js';

describe('lel', () => {
  describe('single gas', () => {
    it('should return pure gas LEL for single component', () => {
      const result = lel({
        gases: [{ name: 'Methane', concentration: 1.0, lel: 5.0 }],
      });

      expect(result.mixtureLel).toBeCloseTo(5.0, 2);
      expect(result.percentOfLel).toBeCloseTo(20, 1);
      // 20% LEL → caution under the industry 10/25 convention
      expect(result.status).toBe('caution');
    });

    it('should detect danger when concentration exceeds 25% LEL', () => {
      const result = lel({
        gases: [{ name: 'Methane', concentration: 3.0, lel: 5.0 }],
      });

      expect(result.percentOfLel).toBeCloseTo(60, 1);
      expect(result.status).toBe('danger');
    });
  });

  describe('mixed gases (Le Chatelier)', () => {
    it('should calculate mixture LEL correctly', () => {
      // Classic example: Methane (LEL=5%) + Ethane (LEL=3%)
      // Equal mole fractions: LEL_mix = 1 / (0.5/5 + 0.5/3) = 1 / (0.1 + 0.1667) = 3.75%
      const result = lel({
        gases: [
          { name: 'Methane', concentration: 1.0, lel: 5.0 },
          { name: 'Ethane', concentration: 1.0, lel: 3.0 },
        ],
      });

      expect(result.mixtureLel).toBeCloseTo(3.75, 2);
      expect(result.totalConcentration).toBeCloseTo(2.0, 2);
    });

    it('should calculate % LEL for mixture', () => {
      const result = lel({
        gases: [
          { name: 'Methane', concentration: 0.5, lel: 5.0 },
          { name: 'Propane', concentration: 0.3, lel: 2.1 },
          { name: 'Hydrogen', concentration: 0.2, lel: 4.0 },
        ],
      });

      expect(result.percentOfLel).toBeGreaterThan(0);
      expect(result.mixtureLel).toBeGreaterThan(0);
      expect(result.contributions).toHaveLength(3);
    });

    it('should have contributions sum to 100%', () => {
      const result = lel({
        gases: [
          { name: 'A', concentration: 2.0, lel: 5.0 },
          { name: 'B', concentration: 3.0, lel: 3.0 },
        ],
      });

      const totalFraction = result.contributions.reduce((s, c) => s + c.fraction, 0);
      expect(totalFraction).toBeCloseTo(100, 0);
    });
  });

  describe('safety margin', () => {
    it('should calculate remaining margin before LEL', () => {
      const result = lel({
        gases: [{ name: 'Methane', concentration: 1.0, lel: 5.0 }],
      });

      expect(result.safetyMargin).toBeCloseTo(4.0, 2);
    });

    it('should have negative margin when above LEL', () => {
      const result = lel({
        gases: [{ name: 'Methane', concentration: 6.0, lel: 5.0 }],
      });

      expect(result.safetyMargin).toBeLessThan(0);
      expect(result.percentOfLel).toBeGreaterThan(100);
    });
  });

  describe('status classification (industry 10/25 convention)', () => {
    it('safe: < 10% LEL', () => {
      // conc 0.4 / lel 5.0 → 8% LEL
      const result = lel({
        gases: [{ name: 'Methane', concentration: 0.4, lel: 5.0 }],
      });
      expect(result.percentOfLel).toBeCloseTo(8, 1);
      expect(result.status).toBe('safe');
    });

    it('caution: 10-25% LEL', () => {
      // conc 1.0 / lel 5.0 → 20% LEL
      const result = lel({
        gases: [{ name: 'Methane', concentration: 1.0, lel: 5.0 }],
      });
      expect(result.percentOfLel).toBeCloseTo(20, 1);
      expect(result.status).toBe('caution');
    });

    it('caution: at 25% LEL boundary (inclusive)', () => {
      // conc 1.25 / lel 5.0 → 25% LEL
      const result = lel({
        gases: [{ name: 'Methane', concentration: 1.25, lel: 5.0 }],
      });
      expect(result.percentOfLel).toBeCloseTo(25, 1);
      expect(result.status).toBe('caution');
    });

    it('danger: > 25% LEL', () => {
      // conc 2.0 / lel 5.0 → 40% LEL
      const result = lel({
        gases: [{ name: 'Methane', concentration: 2.0, lel: 5.0 }],
      });
      expect(result.percentOfLel).toBeCloseTo(40, 1);
      expect(result.status).toBe('danger');
    });
  });

  describe('input validation', () => {
    it('should throw RangeError for negative concentration', () => {
      expect(() => lel({
        gases: [{ name: 'Methane', concentration: -1, lel: 5.0 }],
      })).toThrow(RangeError);
    });

    it('should throw RangeError for non-positive LEL', () => {
      expect(() => lel({
        gases: [{ name: 'Methane', concentration: 1, lel: 0 }],
      })).toThrow(RangeError);
    });
  });

  describe('edge cases', () => {
    it('should handle empty gases array', () => {
      const result = lel({ gases: [] });
      expect(result.mixtureLel).toBe(0);
      expect(result.percentOfLel).toBe(0);
      expect(result.status).toBe('safe');
    });

    it('should handle zero concentration', () => {
      const result = lel({
        gases: [{ name: 'Methane', concentration: 0, lel: 5.0 }],
      });
      expect(result.percentOfLel).toBe(0);
      expect(result.status).toBe('safe');
    });
  });
});
