import { describe, it, expect } from 'vitest';
import { shelfLife } from './shelfLife.js';

describe('shelfLife', () => {
  describe('Q10 rule basic calculations', () => {
    it('should double shelf life when cooled by 10°C (Q10=2)', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30, // 30 days at 25°C
        refTemp: 25,
        targetTemp: 15, // 10°C cooler
        q10: 2,
      });

      // Factor = 2^(10/10) = 2
      expect(result.accelerationFactor).toBe(2);
      expect(result.estimatedShelfLife).toBe(60);
    });

    it('should halve shelf life when warmed by 10°C (Q10=2)', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 35, // 10°C warmer
        q10: 2,
      });

      // Factor = 2^(-10/10) = 0.5
      expect(result.accelerationFactor).toBe(0.5);
      expect(result.estimatedShelfLife).toBe(15);
    });

    it('should not change shelf life at same temperature', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 25,
        q10: 2,
      });

      expect(result.accelerationFactor).toBe(1);
      expect(result.estimatedShelfLife).toBe(30);
    });
  });

  describe('different Q10 values', () => {
    it('should work with Q10=3 (more temperature sensitive)', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 15,
        q10: 3,
      });

      // Factor = 3^(10/10) = 3
      expect(result.accelerationFactor).toBe(3);
      expect(result.estimatedShelfLife).toBe(90);
    });

    it('should work with Q10=1.5 (less temperature sensitive)', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 15,
        q10: 1.5,
      });

      // Factor = 1.5^(10/10) = 1.5
      expect(result.accelerationFactor).toBe(1.5);
      expect(result.estimatedShelfLife).toBe(45);
    });
  });

  describe('partial temperature changes', () => {
    it('should handle 5°C change', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 20, // 5°C cooler
        q10: 2,
      });

      // Factor = 2^(5/10) = 2^0.5 = 1.414
      expect(result.accelerationFactor).toBeCloseTo(1.414, 2);
      expect(result.estimatedShelfLife).toBeCloseTo(42.43, 1);
    });

    it('should handle 20°C change', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 5, // 20°C cooler
        q10: 2,
      });

      // Factor = 2^(20/10) = 2² = 4
      expect(result.accelerationFactor).toBe(4);
      expect(result.estimatedShelfLife).toBe(120);
    });

    it('should handle 15°C change', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 10, // 15°C cooler
        q10: 2,
      });

      // Factor = 2^(15/10) = 2^1.5 = 2.828
      expect(result.accelerationFactor).toBeCloseTo(2.828, 2);
    });
  });

  describe('temperature difference tracking', () => {
    it('should track positive temperature difference (cooling)', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 5,
        q10: 2,
      });

      expect(result.tempDifference).toBe(20);
    });

    it('should track negative temperature difference (warming)', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 40,
        q10: 2,
      });

      expect(result.tempDifference).toBe(-15);
    });

    it('should preserve reference and target temperatures', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 4,
        q10: 2,
      });

      expect(result.refTemp).toBe(25);
      expect(result.targetTemp).toBe(4);
    });
  });

  describe('edge cases', () => {
    it('should handle Q10=1 (no temperature effect)', () => {
      const result = shelfLife({
        shelfLifeAtRef: 30,
        refTemp: 25,
        targetTemp: 15,
        q10: 1,
      });

      expect(result.accelerationFactor).toBe(1);
      expect(result.estimatedShelfLife).toBe(30);
    });

    it('should handle very large temperature drops', () => {
      const result = shelfLife({
        shelfLifeAtRef: 7, // Fresh milk
        refTemp: 25,
        targetTemp: -18, // Frozen
        q10: 2,
      });

      // Factor = 2^(43/10) = 2^4.3 = 19.7
      expect(result.accelerationFactor).toBeCloseTo(19.7, 0);
      expect(result.estimatedShelfLife).toBeCloseTo(138, 0);
    });

    it('should handle very short reference shelf life', () => {
      const result = shelfLife({
        shelfLifeAtRef: 1, // 1 day
        refTemp: 25,
        targetTemp: 4,
        q10: 2,
      });

      expect(result.estimatedShelfLife).toBeCloseTo(4.29, 1);
    });
  });

  describe('real-world scenarios', () => {
    it('should estimate refrigerated milk shelf life', () => {
      // Milk at 25°C: ~1 day, Q10 ≈ 2.5
      const result = shelfLife({
        shelfLifeAtRef: 1,
        refTemp: 25,
        targetTemp: 4, // Refrigerator
        q10: 2.5,
      });

      // Factor = 2.5^(21/10) = 2.5^2.1 ≈ 6.85
      expect(result.estimatedShelfLife).toBeCloseTo(6.85, 0);
    });

    it('should estimate frozen food shelf life', () => {
      // Fresh produce at 4°C: 7 days
      const result = shelfLife({
        shelfLifeAtRef: 7,
        refTemp: 4,
        targetTemp: -18, // Freezer
        q10: 2,
      });

      // Factor = 2^(22/10) = 2^2.2 = 4.59
      expect(result.estimatedShelfLife).toBeCloseTo(32.2, 0);
    });

    it('should estimate pharmaceutical stability', () => {
      // Drug at 25°C: 24 months, Q10 = 3
      const result = shelfLife({
        shelfLifeAtRef: 24,
        refTemp: 25,
        targetTemp: 5, // Cold chain
        q10: 3,
      });

      // Factor = 3^(20/10) = 9
      expect(result.estimatedShelfLife).toBe(216);
    });

    it('should estimate accelerated stability testing', () => {
      // Drug at 25°C: unknown, tested at 40°C for 3 months
      const result = shelfLife({
        shelfLifeAtRef: 3, // 3 months at 40°C
        refTemp: 40,
        targetTemp: 25, // Normal storage
        q10: 3,
      });

      // Factor = 3^(15/10) = 3^1.5 = 5.196
      expect(result.estimatedShelfLife).toBeCloseTo(15.59, 1);
    });

    it('should estimate enzyme activity decay', () => {
      // Enzyme at 4°C: 6 months, Q10 = 2
      const result = shelfLife({
        shelfLifeAtRef: 6,
        refTemp: 4,
        targetTemp: 25, // Room temp
        q10: 2,
      });

      // Factor = 2^(-21/10) = 2^-2.1 = 0.233
      expect(result.accelerationFactor).toBeCloseTo(0.233, 2);
      expect(result.estimatedShelfLife).toBeCloseTo(1.4, 1);
    });
  });
});
