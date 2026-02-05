import { describe, it, expect } from 'vitest';
import { fuelEconomy } from './fuelEconomy.js';

describe('fuelEconomy', () => {
  describe('conversion from km/L', () => {
    it('should return same value for km/L', () => {
      const result = fuelEconomy({
        fromUnit: 'kmPerL',
        value: 15,
      });

      expect(result.kmPerL).toBe(15);
    });

    it('should convert to L/100km correctly', () => {
      const result = fuelEconomy({
        fromUnit: 'kmPerL',
        value: 10,
      });

      // 10 km/L = 100/10 = 10 L/100km
      expect(result.lPer100km).toBe(10);
    });

    it('should convert to mpg US correctly', () => {
      const result = fuelEconomy({
        fromUnit: 'kmPerL',
        value: 10,
      });

      // 10 km/L × 3.785 / 1.609 = 23.52 mpg
      expect(result.mpgUS).toBeCloseTo(23.52, 1);
    });

    it('should convert to mpg UK correctly', () => {
      const result = fuelEconomy({
        fromUnit: 'kmPerL',
        value: 10,
      });

      // 10 km/L × 4.546 / 1.609 = 28.25 mpg UK
      expect(result.mpgUK).toBeCloseTo(28.25, 1);
    });
  });

  describe('conversion from L/100km', () => {
    it('should convert to km/L correctly', () => {
      const result = fuelEconomy({
        fromUnit: 'lPer100km',
        value: 8,
      });

      // 8 L/100km = 100/8 = 12.5 km/L
      expect(result.kmPerL).toBe(12.5);
    });

    it('should convert to L/100km (same value)', () => {
      const result = fuelEconomy({
        fromUnit: 'lPer100km',
        value: 8,
      });

      expect(result.lPer100km).toBe(8);
    });
  });

  describe('conversion from mpg US', () => {
    it('should convert to km/L correctly', () => {
      const result = fuelEconomy({
        fromUnit: 'mpgUS',
        value: 30,
      });

      // 30 mpg × 1.609 / 3.785 = 12.75 km/L
      expect(result.kmPerL).toBeCloseTo(12.75, 1);
    });

    it('should convert to L/100km correctly', () => {
      const result = fuelEconomy({
        fromUnit: 'mpgUS',
        value: 30,
      });

      // 100 / 12.75 = 7.84 L/100km
      expect(result.lPer100km).toBeCloseTo(7.84, 1);
    });

    it('should return same value for mpg US', () => {
      const result = fuelEconomy({
        fromUnit: 'mpgUS',
        value: 30,
      });

      expect(result.mpgUS).toBeCloseTo(30, 0);
    });
  });

  describe('conversion from mpg UK', () => {
    it('should convert to km/L correctly', () => {
      const result = fuelEconomy({
        fromUnit: 'mpgUK',
        value: 35,
      });

      // 35 mpg UK × 1.609 / 4.546 = 12.39 km/L
      expect(result.kmPerL).toBeCloseTo(12.39, 1);
    });

    it('should convert to mpg US correctly', () => {
      const result = fuelEconomy({
        fromUnit: 'mpgUK',
        value: 35,
      });

      // mpg UK > mpg US (UK gallon is larger)
      expect(result.mpgUS).toBeLessThan(35);
      expect(result.mpgUS).toBeCloseTo(29.14, 1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero value', () => {
      const result = fuelEconomy({
        fromUnit: 'kmPerL',
        value: 0,
      });

      expect(result.kmPerL).toBe(0);
      expect(result.lPer100km).toBe(0);
      expect(result.mpgUS).toBe(0);
      expect(result.mpgUK).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should convert typical European car consumption', () => {
      const result = fuelEconomy({
        fromUnit: 'lPer100km',
        value: 6.5,
      });

      // 6.5 L/100km is typical for European compact
      expect(result.kmPerL).toBeCloseTo(15.38, 1);
      expect(result.mpgUS).toBeCloseTo(36.19, 0);
    });

    it('should convert typical US car mpg', () => {
      const result = fuelEconomy({
        fromUnit: 'mpgUS',
        value: 28,
      });

      // 28 mpg is typical for US sedan
      expect(result.lPer100km).toBeCloseTo(8.4, 0);
    });

    it('should convert hybrid car fuel economy', () => {
      const result = fuelEconomy({
        fromUnit: 'kmPerL',
        value: 25,
      });

      // 25 km/L is typical for hybrid
      expect(result.lPer100km).toBe(4);
      expect(result.mpgUS).toBeCloseTo(58.79, 0);
    });

    it('should convert SUV fuel consumption', () => {
      const result = fuelEconomy({
        fromUnit: 'lPer100km',
        value: 12,
      });

      // 12 L/100km is typical for large SUV
      expect(result.mpgUS).toBeCloseTo(19.6, 0);
    });
  });
});
