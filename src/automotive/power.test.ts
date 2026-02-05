import { describe, it, expect } from 'vitest';
import { power } from './power.js';

describe('power', () => {
  describe('conversion from kW', () => {
    it('should return same value for kW', () => {
      const result = power({
        fromUnit: 'kW',
        value: 100,
      });

      expect(result.kW).toBe(100);
    });

    it('should convert to HP correctly', () => {
      const result = power({
        fromUnit: 'kW',
        value: 100,
      });

      // 100 kW × 1.34102 = 134.1 HP
      expect(result.HP).toBeCloseTo(134.1, 0);
    });

    it('should convert to PS correctly', () => {
      const result = power({
        fromUnit: 'kW',
        value: 100,
      });

      // 100 kW × 1.35962 = 135.96 PS
      expect(result.PS).toBeCloseTo(135.96, 1);
    });
  });

  describe('conversion from HP', () => {
    it('should convert to kW correctly', () => {
      const result = power({
        fromUnit: 'HP',
        value: 200,
      });

      // 200 HP / 1.34102 = 149.14 kW
      expect(result.kW).toBeCloseTo(149.14, 0);
    });

    it('should return correct HP', () => {
      const result = power({
        fromUnit: 'HP',
        value: 200,
      });

      expect(result.HP).toBeCloseTo(200, 0);
    });

    it('should convert to PS correctly', () => {
      const result = power({
        fromUnit: 'HP',
        value: 200,
      });

      // 149.14 kW × 1.35962 = 202.78 PS
      expect(result.PS).toBeCloseTo(202.78, 0);
    });
  });

  describe('conversion from PS', () => {
    it('should convert to kW correctly', () => {
      const result = power({
        fromUnit: 'PS',
        value: 150,
      });

      // 150 PS / 1.35962 = 110.32 kW
      expect(result.kW).toBeCloseTo(110.32, 0);
    });

    it('should convert to HP correctly', () => {
      const result = power({
        fromUnit: 'PS',
        value: 150,
      });

      // 110.32 kW × 1.34102 = 147.93 HP
      expect(result.HP).toBeCloseTo(147.93, 0);
    });

    it('should return correct PS', () => {
      const result = power({
        fromUnit: 'PS',
        value: 150,
      });

      expect(result.PS).toBeCloseTo(150, 0);
    });
  });

  describe('edge cases', () => {
    it('should handle zero value', () => {
      const result = power({
        fromUnit: 'kW',
        value: 0,
      });

      expect(result.kW).toBe(0);
      expect(result.HP).toBe(0);
      expect(result.PS).toBe(0);
    });

    it('should handle small values', () => {
      const result = power({
        fromUnit: 'kW',
        value: 1,
      });

      expect(result.kW).toBe(1);
      expect(result.HP).toBeCloseTo(1.34, 1);
      expect(result.PS).toBeCloseTo(1.36, 1);
    });

    it('should handle large values', () => {
      const result = power({
        fromUnit: 'HP',
        value: 1000,
      });

      expect(result.kW).toBeCloseTo(745.7, 0);
      expect(result.PS).toBeCloseTo(1013.87, 0);
    });
  });

  describe('real-world scenarios', () => {
    it('should convert EV motor power', () => {
      // Tesla Model 3 Performance: 353 kW
      const result = power({
        fromUnit: 'kW',
        value: 353,
      });

      expect(result.HP).toBeCloseTo(473.38, 0);
    });

    it('should convert European car spec (kW to HP)', () => {
      // BMW M3: 353 kW
      const result = power({
        fromUnit: 'kW',
        value: 353,
      });

      expect(result.HP).toBeCloseTo(473.38, 0);
      expect(result.PS).toBeCloseTo(479.94, 0);
    });

    it('should convert Japanese car spec (PS to HP)', () => {
      // GTR: 570 PS
      const result = power({
        fromUnit: 'PS',
        value: 570,
      });

      expect(result.HP).toBeCloseTo(562.15, 0);
      expect(result.kW).toBeCloseTo(419.21, 0);
    });

    it('should convert American muscle car (HP)', () => {
      // Mustang GT: 460 HP
      const result = power({
        fromUnit: 'HP',
        value: 460,
      });

      expect(result.kW).toBeCloseTo(343.02, 0);
      expect(result.PS).toBeCloseTo(466.40, 0);
    });

    it('should convert economy car power', () => {
      // Typical 1.6L: 90 kW
      const result = power({
        fromUnit: 'kW',
        value: 90,
      });

      expect(result.HP).toBeCloseTo(120.69, 0);
      expect(result.PS).toBeCloseTo(122.37, 0);
    });
  });

  describe('HP vs PS comparison', () => {
    it('should show PS > HP for same engine', () => {
      // PS (metric) is slightly smaller unit than HP
      // So same engine has higher PS number
      const result = power({
        fromUnit: 'kW',
        value: 100,
      });

      expect(result.PS).toBeGreaterThan(result.HP);
    });

    it('should show approximately 1.4% difference', () => {
      const result = power({
        fromUnit: 'kW',
        value: 100,
      });

      const diff = ((result.PS - result.HP) / result.HP) * 100;
      expect(diff).toBeCloseTo(1.39, 0);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain value through kW -> HP -> kW', () => {
      const original = 100;
      const toHp = power({ fromUnit: 'kW', value: original });
      const backToKw = power({ fromUnit: 'HP', value: toHp.HP });

      expect(backToKw.kW).toBeCloseTo(original, 0);
    });

    it('should maintain value through PS -> kW -> PS', () => {
      const original = 200;
      const toKw = power({ fromUnit: 'PS', value: original });
      const backToPs = power({ fromUnit: 'kW', value: toKw.kW });

      expect(backToPs.PS).toBeCloseTo(original, 0);
    });
  });
});
