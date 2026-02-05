import { describe, it, expect } from 'vitest';
import { freightClass } from './freightClass.js';

describe('freightClass', () => {
  describe('density calculation', () => {
    it('should calculate density from weight and dimensions', () => {
      const result = freightClass({
        weight: 100, // lbs
        length: 24, // inches
        width: 24,
        height: 24,
      });

      // Volume = 24x24x24 = 13824 cu in = 8 cu ft
      // Density = 100 / 8 = 12.5 lbs/cu ft
      expect(result.density).toBeCloseTo(12.5, 1);
      expect(result.volumeCuFt).toBeCloseTo(8, 2);
    });
  });

  describe('freight class determination', () => {
    it('should return class 50 for high density', () => {
      const result = freightClass({
        weight: 500,
        length: 20,
        width: 20,
        height: 20,
      });

      // Density = 500 / 4.63 = 108 lbs/cu ft
      expect(result.freightClass).toBe(50);
      expect(result.className).toContain('Clean');
    });

    it('should return class 100 for medium density', () => {
      const result = freightClass({
        weight: 75,
        length: 24,
        width: 24,
        height: 24,
      });

      // Density = 75 / 8 = 9.375 lbs/cu ft (class 100)
      expect(result.freightClass).toBe(100);
    });

    it('should return class 500 for very low density', () => {
      const result = freightClass({
        weight: 5,
        length: 48,
        width: 48,
        height: 48,
      });

      // Density = 5 / 64 = 0.078 lbs/cu ft
      expect(result.freightClass).toBe(500);
    });
  });

  describe('class names', () => {
    it('should return appropriate class name', () => {
      const result = freightClass({
        weight: 100,
        length: 24,
        width: 24,
        height: 24,
      });

      expect(result.className.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle zero weight', () => {
      const result = freightClass({
        weight: 0,
        length: 24,
        width: 24,
        height: 24,
      });

      expect(result.freightClass).toBe(0);
      expect(result.className).toBe('Invalid Input');
    });

    it('should handle zero dimensions', () => {
      const result = freightClass({
        weight: 100,
        length: 0,
        width: 24,
        height: 24,
      });

      expect(result.freightClass).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should classify electronics shipment', () => {
      // Light electronics in larger box for lower density
      const result = freightClass({
        weight: 25,
        length: 24,
        width: 20,
        height: 16,
      });

      // Electronics with lower density typically class 100-150
      expect(result.freightClass).toBeGreaterThanOrEqual(77.5);
      expect(result.freightClass).toBeLessThanOrEqual(200);
    });

    it('should classify furniture shipment', () => {
      const result = freightClass({
        weight: 100,
        length: 72,
        width: 36,
        height: 30,
      });

      // Furniture typically class 150-250
      expect(result.freightClass).toBeGreaterThanOrEqual(125);
    });

    it('should classify heavy machinery', () => {
      const result = freightClass({
        weight: 2000,
        length: 48,
        width: 48,
        height: 36,
      });

      // Dense machinery typically class 50-70
      expect(result.freightClass).toBeLessThanOrEqual(85);
    });
  });
});
