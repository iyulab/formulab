import { describe, it, expect } from 'vitest';
import { roof } from './roof.js';

describe('roof', () => {
  describe('slope calculations', () => {
    it('should calculate 4:12 pitch', () => {
      const result = roof({
        rise: 4,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.slopeRatio).toBe('4:12');
      expect(result.slopeDegrees).toBeCloseTo(18.43, 1);
      expect(result.slopePercent).toBeCloseTo(33.33, 1);
    });

    it('should calculate 6:12 pitch', () => {
      const result = roof({
        rise: 6,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.slopeRatio).toBe('6:12');
      expect(result.slopeDegrees).toBeCloseTo(26.57, 1);
      expect(result.slopePercent).toBe(50);
    });

    it('should calculate 12:12 pitch (45 degrees)', () => {
      const result = roof({
        rise: 12,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.slopeRatio).toBe('12:12');
      expect(result.slopeDegrees).toBe(45);
      expect(result.slopePercent).toBe(100);
    });

    it('should handle non-standard pitch ratios', () => {
      const result = roof({
        rise: 5,
        run: 10, // 6:12 equivalent
        footprintLength: 20,
        footprintWidth: 10,
      });

      expect(result.slopeRatio).toBe('6:12');
    });
  });

  describe('rafter length', () => {
    it('should calculate rafter length using pythagorean theorem', () => {
      const result = roof({
        rise: 3,
        run: 4,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.rafterLength).toBe(5); // 3-4-5 triangle
    });

    it('should calculate rafter for 6:12 pitch', () => {
      const result = roof({
        rise: 6,
        run: 12,
        footprintLength: 20,
        footprintWidth: 10,
      });

      expect(result.rafterLength).toBeCloseTo(13.416, 2);
    });
  });

  describe('slope factor', () => {
    it('should calculate slope factor for flat roof', () => {
      const result = roof({
        rise: 0.5,
        run: 12,
        footprintLength: 100,
        footprintWidth: 50,
      });

      expect(result.slopeFactor).toBeCloseTo(1.0009, 3);
    });

    it('should calculate slope factor for 6:12 pitch', () => {
      const result = roof({
        rise: 6,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      // sqrt(1 + (6/12)^2) = sqrt(1.25) = 1.118
      expect(result.slopeFactor).toBeCloseTo(1.118, 2);
    });

    it('should calculate slope factor for 12:12 pitch', () => {
      const result = roof({
        rise: 12,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      // sqrt(1 + 1) = sqrt(2) = 1.414
      expect(result.slopeFactor).toBeCloseTo(1.414, 2);
    });
  });

  describe('roof area', () => {
    it('should calculate roof area with slope factor', () => {
      const result = roof({
        rise: 6,
        run: 12,
        footprintLength: 40,
        footprintWidth: 20,
      });

      // Footprint = 40 * 20 = 800
      // Slope factor ≈ 1.118
      // Roof area ≈ 894.4
      expect(result.roofArea).toBeCloseTo(894.43, 0);
    });

    it('should handle large roof area', () => {
      const result = roof({
        rise: 4,
        run: 12,
        footprintLength: 100,
        footprintWidth: 50,
      });

      expect(result.roofArea).toBeGreaterThan(5000);
    });
  });

  describe('pitch descriptions', () => {
    it('should identify flat pitch', () => {
      const result = roof({
        rise: 1,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.pitchDescription).toBe('flat');
    });

    it('should identify low pitch', () => {
      const result = roof({
        rise: 3,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.pitchDescription).toBe('low');
    });

    it('should identify conventional pitch', () => {
      const result = roof({
        rise: 6,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.pitchDescription).toBe('conventional');
    });

    it('should identify steep pitch', () => {
      const result = roof({
        rise: 12,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.pitchDescription).toBe('steep');
    });

    it('should identify extreme pitch', () => {
      const result = roof({
        rise: 20,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.pitchDescription).toBe('extreme');
    });
  });

  describe('edge cases', () => {
    it('should throw error for zero run', () => {
      expect(() =>
        roof({
          rise: 6,
          run: 0,
          footprintLength: 10,
          footprintWidth: 8,
        })
      ).toThrow('Run must be greater than zero');
    });

    it('should throw error for negative run', () => {
      expect(() =>
        roof({
          rise: 6,
          run: -12,
          footprintLength: 10,
          footprintWidth: 8,
        })
      ).toThrow('Run must be greater than zero');
    });

    it('should throw error for negative rise', () => {
      expect(() =>
        roof({
          rise: -6,
          run: 12,
          footprintLength: 10,
          footprintWidth: 8,
        })
      ).toThrow('Rise must be non-negative');
    });

    it('should handle zero rise (flat roof)', () => {
      const result = roof({
        rise: 0,
        run: 12,
        footprintLength: 10,
        footprintWidth: 8,
      });

      expect(result.slopeDegrees).toBe(0);
      expect(result.slopePercent).toBe(0);
      expect(result.slopeFactor).toBe(1);
      expect(result.roofArea).toBe(80);
    });

    it('should handle very small footprint', () => {
      const result = roof({
        rise: 4,
        run: 12,
        footprintLength: 1,
        footprintWidth: 1,
      });

      expect(result.roofArea).toBeGreaterThan(1);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate residential roof (typical 4:12)', () => {
      const result = roof({
        rise: 4,
        run: 12,
        footprintLength: 50, // 50 ft
        footprintWidth: 30, // 30 ft
      });

      expect(result.pitchDescription).toBe('conventional');
      expect(result.roofArea).toBeGreaterThan(1500);
    });

    it('should calculate commercial flat roof', () => {
      const result = roof({
        rise: 0.5,
        run: 12,
        footprintLength: 200,
        footprintWidth: 100,
      });

      expect(result.pitchDescription).toBe('flat');
      expect(result.slopeDegrees).toBeLessThan(5);
    });

    it('should calculate steep A-frame cabin', () => {
      const result = roof({
        rise: 15,
        run: 12,
        footprintLength: 30,
        footprintWidth: 20,
      });

      expect(result.pitchDescription).toBe('steep');
      expect(result.slopeDegrees).toBeGreaterThan(45);
    });

    it('should calculate shed roof', () => {
      const result = roof({
        rise: 2,
        run: 12,
        footprintLength: 12,
        footprintWidth: 10,
      });

      expect(result.pitchDescription).toBe('low');
      expect(result.slopeFactor).toBeCloseTo(1.014, 2);
    });
  });
});
