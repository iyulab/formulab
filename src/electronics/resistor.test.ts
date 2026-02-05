import { describe, it, expect } from 'vitest';
import { resistorDecode } from './resistor.js';

describe('resistorDecode', () => {
  describe('4-band resistor', () => {
    it('should decode brown-black-red-gold (1kΩ 5%)', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['brown', 'black', 'red', 'gold'],
      });

      // 1-0 × 100 = 1000Ω = 1kΩ
      expect(result.resistance).toBe(1000);
      expect(result.tolerance).toBe(5);
      expect(result.formatted).toContain('1kΩ');
      expect(result.formatted).toContain('±5%');
    });

    it('should decode yellow-violet-orange-silver (47kΩ 10%)', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['yellow', 'violet', 'orange', 'silver'],
      });

      // 4-7 × 1000 = 47000Ω = 47kΩ
      expect(result.resistance).toBe(47000);
      expect(result.tolerance).toBe(10);
      expect(result.formatted).toContain('47kΩ');
    });

    it('should decode red-red-brown-gold (220Ω 5%)', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['red', 'red', 'brown', 'gold'],
      });

      // 2-2 × 10 = 220Ω
      expect(result.resistance).toBe(220);
      expect(result.formatted).toContain('220Ω');
    });

    it('should decode brown-black-green-gold (1MΩ)', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['brown', 'black', 'green', 'gold'],
      });

      // 1-0 × 100000 = 1000000Ω = 1MΩ
      expect(result.resistance).toBe(1000000);
      expect(result.formatted).toContain('1MΩ');
    });

    it('should handle gold multiplier (fractional ohms)', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['green', 'blue', 'gold', 'gold'],
      });

      // 5-6 × 0.1 = 5.6Ω
      expect(result.resistance).toBeCloseTo(5.6, 1);
    });

    it('should handle silver multiplier', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['brown', 'red', 'silver', 'gold'],
      });

      // 1-2 × 0.01 = 0.12Ω
      expect(result.resistance).toBeCloseTo(0.12, 2);
    });
  });

  describe('5-band resistor', () => {
    it('should decode brown-black-black-red-brown (10kΩ 1%)', () => {
      const result = resistorDecode({
        bandCount: 5,
        bands: ['brown', 'black', 'black', 'red', 'brown'],
      });

      // 1-0-0 × 100 = 10000Ω = 10kΩ
      expect(result.resistance).toBe(10000);
      expect(result.tolerance).toBe(1);
    });

    it('should decode red-violet-black-brown-green (2.7kΩ 0.5%)', () => {
      const result = resistorDecode({
        bandCount: 5,
        bands: ['red', 'violet', 'black', 'brown', 'green'],
      });

      // 2-7-0 × 10 = 2700Ω = 2.7kΩ
      expect(result.resistance).toBe(2700);
      expect(result.tolerance).toBe(0.5);
    });

    it('should decode orange-orange-black-black-brown (330Ω 1%)', () => {
      const result = resistorDecode({
        bandCount: 5,
        bands: ['orange', 'orange', 'black', 'black', 'brown'],
      });

      // 3-3-0 × 1 = 330Ω
      expect(result.resistance).toBe(330);
    });
  });

  describe('6-band resistor', () => {
    it('should decode 6-band with temperature coefficient', () => {
      const result = resistorDecode({
        bandCount: 6,
        bands: ['brown', 'black', 'black', 'red', 'brown', 'brown'],
      });

      expect(result.resistance).toBe(10000);
      expect(result.tolerance).toBe(1);
      expect(result.tempCoeff).toBe(100);
      expect(result.formatted).toContain('100ppm');
    });

    it('should decode blue temperature coefficient', () => {
      const result = resistorDecode({
        bandCount: 6,
        bands: ['yellow', 'violet', 'black', 'brown', 'brown', 'blue'],
      });

      expect(result.tempCoeff).toBe(10);
    });

    it('should decode red temperature coefficient', () => {
      const result = resistorDecode({
        bandCount: 6,
        bands: ['brown', 'black', 'black', 'brown', 'brown', 'red'],
      });

      expect(result.tempCoeff).toBe(50);
    });
  });

  describe('tolerance bands', () => {
    it('should decode brown tolerance (1%)', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['brown', 'black', 'red', 'brown'],
      });

      expect(result.tolerance).toBe(1);
    });

    it('should decode red tolerance (2%)', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['brown', 'black', 'red', 'red'],
      });

      expect(result.tolerance).toBe(2);
    });

    it('should decode green tolerance (0.5%)', () => {
      const result = resistorDecode({
        bandCount: 5,
        bands: ['brown', 'black', 'black', 'red', 'green'],
      });

      expect(result.tolerance).toBe(0.5);
    });

    it('should decode blue tolerance (0.25%)', () => {
      const result = resistorDecode({
        bandCount: 5,
        bands: ['brown', 'black', 'black', 'red', 'blue'],
      });

      expect(result.tolerance).toBe(0.25);
    });

    it('should decode violet tolerance (0.1%)', () => {
      const result = resistorDecode({
        bandCount: 5,
        bands: ['brown', 'black', 'black', 'red', 'violet'],
      });

      expect(result.tolerance).toBe(0.1);
    });
  });

  describe('formatting', () => {
    it('should format ohms correctly', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['red', 'red', 'black', 'gold'],
      });

      expect(result.formatted).toContain('Ω');
      expect(result.formatted).toContain('22');
    });

    it('should format kilohms correctly', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['brown', 'black', 'orange', 'gold'],
      });

      expect(result.formatted).toContain('kΩ');
    });

    it('should format megohms correctly', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['brown', 'black', 'blue', 'gold'],
      });

      expect(result.formatted).toContain('MΩ');
    });
  });

  describe('real-world resistor values', () => {
    it('should decode common 10kΩ resistor', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['brown', 'black', 'orange', 'gold'],
      });

      expect(result.resistance).toBe(10000);
    });

    it('should decode common 4.7kΩ resistor', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['yellow', 'violet', 'red', 'gold'],
      });

      expect(result.resistance).toBe(4700);
    });

    it('should decode common 100Ω resistor', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['brown', 'black', 'brown', 'gold'],
      });

      expect(result.resistance).toBe(100);
    });

    it('should decode common 330Ω resistor', () => {
      const result = resistorDecode({
        bandCount: 4,
        bands: ['orange', 'orange', 'brown', 'gold'],
      });

      expect(result.resistance).toBe(330);
    });
  });
});
