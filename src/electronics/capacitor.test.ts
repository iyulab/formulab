import { describe, it, expect } from 'vitest';
import { capacitorDecode } from './capacitor.js';

describe('capacitorDecode', () => {
  describe('basic decoding', () => {
    it('should decode 104 as 100nF (0.1µF)', () => {
      const result = capacitorDecode({ code: '104' });

      // 10 × 10^4 = 100,000 pF = 100 nF = 0.1 µF
      expect(result.picofarads).toBe(100000);
      expect(result.nanofarads).toBe(100);
      expect(result.microfarads).toBe(0.1);
    });

    it('should decode 103 as 10nF (0.01µF)', () => {
      const result = capacitorDecode({ code: '103' });

      // 10 × 10^3 = 10,000 pF = 10 nF
      expect(result.picofarads).toBe(10000);
      expect(result.nanofarads).toBe(10);
      expect(result.microfarads).toBe(0.01);
    });

    it('should decode 102 as 1nF (1000pF)', () => {
      const result = capacitorDecode({ code: '102' });

      // 10 × 10^2 = 1,000 pF = 1 nF
      expect(result.picofarads).toBe(1000);
      expect(result.nanofarads).toBe(1);
    });

    it('should decode 101 as 100pF', () => {
      const result = capacitorDecode({ code: '101' });

      // 10 × 10^1 = 100 pF
      expect(result.picofarads).toBe(100);
    });

    it('should decode 100 as 10pF', () => {
      const result = capacitorDecode({ code: '100' });

      // 10 × 10^0 = 10 pF
      expect(result.picofarads).toBe(10);
    });
  });

  describe('various codes', () => {
    it('should decode 220 as 22pF', () => {
      const result = capacitorDecode({ code: '220' });

      // 22 × 10^0 = 22 pF
      expect(result.picofarads).toBe(22);
    });

    it('should decode 471 as 470pF', () => {
      const result = capacitorDecode({ code: '471' });

      // 47 × 10^1 = 470 pF
      expect(result.picofarads).toBe(470);
    });

    it('should decode 222 as 2.2nF', () => {
      const result = capacitorDecode({ code: '222' });

      // 22 × 10^2 = 2,200 pF = 2.2 nF
      expect(result.picofarads).toBe(2200);
      expect(result.nanofarads).toBe(2.2);
    });

    it('should decode 473 as 47nF', () => {
      const result = capacitorDecode({ code: '473' });

      // 47 × 10^3 = 47,000 pF = 47 nF
      expect(result.picofarads).toBe(47000);
      expect(result.nanofarads).toBe(47);
    });

    it('should decode 474 as 470nF (0.47µF)', () => {
      const result = capacitorDecode({ code: '474' });

      // 47 × 10^4 = 470,000 pF = 470 nF = 0.47 µF
      expect(result.picofarads).toBe(470000);
      expect(result.nanofarads).toBe(470);
      expect(result.microfarads).toBe(0.47);
    });

    it('should decode 105 as 1µF', () => {
      const result = capacitorDecode({ code: '105' });

      // 10 × 10^5 = 1,000,000 pF = 1,000 nF = 1 µF
      expect(result.picofarads).toBe(1000000);
      expect(result.nanofarads).toBe(1000);
      expect(result.microfarads).toBe(1);
    });

    it('should decode 225 as 2.2µF', () => {
      const result = capacitorDecode({ code: '225' });

      // 22 × 10^5 = 2,200,000 pF = 2,200 nF = 2.2 µF
      expect(result.picofarads).toBe(2200000);
      expect(result.microfarads).toBe(2.2);
    });
  });

  describe('significant figures and multiplier', () => {
    it('should extract significant figures correctly', () => {
      const result = capacitorDecode({ code: '472' });

      expect(result.significantFigures).toBe(47);
    });

    it('should extract multiplier correctly', () => {
      const result = capacitorDecode({ code: '104' });

      expect(result.multiplier).toBe(10000);
    });
  });

  describe('formatted output', () => {
    it('should format small values in pF', () => {
      const result = capacitorDecode({ code: '220' });

      expect(result.formatted).toBe('22pF');
    });

    it('should format medium values in nF', () => {
      const result = capacitorDecode({ code: '103' });

      expect(result.formatted).toBe('10nF');
    });

    it('should format large values in µF', () => {
      const result = capacitorDecode({ code: '105' });

      expect(result.formatted).toBe('1µF');
    });

    it('should format 104 as 100nF', () => {
      const result = capacitorDecode({ code: '104' });

      expect(result.formatted).toBe('100nF');
    });
  });

  describe('error handling', () => {
    it('should throw error for code less than 3 digits', () => {
      expect(() => capacitorDecode({ code: '10' })).toThrow('Invalid capacitor code');
    });

    it('should throw error for code more than 3 digits', () => {
      expect(() => capacitorDecode({ code: '1040' })).toThrow('Invalid capacitor code');
    });

    it('should throw error for non-numeric code', () => {
      expect(() => capacitorDecode({ code: '10A' })).toThrow('Invalid capacitor code');
    });

    it('should throw error for empty code', () => {
      expect(() => capacitorDecode({ code: '' })).toThrow('Invalid capacitor code');
    });
  });

  describe('edge cases', () => {
    it('should handle 010 (1pF)', () => {
      const result = capacitorDecode({ code: '010' });

      // 01 × 10^0 = 1 pF
      expect(result.picofarads).toBe(1);
    });

    it('should handle 999 (99 × 10^9 pF)', () => {
      const result = capacitorDecode({ code: '999' });

      // 99 × 10^9 = 99,000,000,000 pF = 99,000 µF
      expect(result.picofarads).toBe(99000000000);
    });
  });

  describe('common capacitor values', () => {
    it('should decode bypass capacitor 100nF (104)', () => {
      const result = capacitorDecode({ code: '104' });

      expect(result.microfarads).toBe(0.1);
    });

    it('should decode filter capacitor 10µF (106)', () => {
      const result = capacitorDecode({ code: '106' });

      // 10 × 10^6 = 10,000,000 pF = 10 µF
      expect(result.microfarads).toBe(10);
    });

    it('should decode ceramic capacitor 22pF (220)', () => {
      const result = capacitorDecode({ code: '220' });

      expect(result.picofarads).toBe(22);
    });

    it('should decode timing capacitor 4.7nF (472)', () => {
      const result = capacitorDecode({ code: '472' });

      // 47 × 10^2 = 4700 pF = 4.7 nF
      expect(result.nanofarads).toBe(4.7);
    });
  });
});
