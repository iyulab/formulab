import { describe, it, expect } from 'vitest';
import { tap } from './tap.js';

describe('tap', () => {
  describe('metric thread tap drill', () => {
    it('should calculate tap drill for M10x1.5 at 75%', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
        threadPercentage: 75,
      });

      // Standard tap drill for M10 is 8.5mm
      expect(result.tapDrillSize).toBeCloseTo(8.5, 0);
    });

    it('should calculate tap drill for M6x1.0', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 6,
        pitch: 1.0,
        threadPercentage: 75,
      });

      expect(result.tapDrillSize).toBeCloseTo(5.0, 0);
    });

    it('should calculate tap drill for M12x1.75', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 12,
        pitch: 1.75,
        threadPercentage: 75,
      });

      expect(result.tapDrillSize).toBeCloseTo(10.2, 0);
    });
  });

  describe('thread percentage variations', () => {
    it('should calculate larger drill for lower thread percentage', () => {
      const high = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
        threadPercentage: 75,
      });

      const low = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
        threadPercentage: 60,
      });

      expect(low.tapDrillSize).toBeGreaterThan(high.tapDrillSize);
    });

    it('should default to 75% thread engagement', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
      });

      expect(result.threadPercentage).toBe(75);
    });
  });

  describe('thread dimensions', () => {
    it('should calculate minor diameter', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
      });

      // Minor diameter = D - 1.25H where H = 0.866 x p
      expect(result.minorDiameter).toBeGreaterThan(0);
      expect(result.minorDiameter).toBeLessThan(10);
    });

    it('should calculate pitch diameter', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
      });

      expect(result.pitchDiameter).toBeGreaterThan(result.minorDiameter);
      expect(result.pitchDiameter).toBeLessThan(10);
    });

    it('should calculate thread height', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 1.5,
      });

      // H = 0.866 x pitch = 0.866 x 1.5 = 1.299
      expect(result.threadHeight).toBeCloseTo(1.299, 2);
    });
  });

  describe('unified thread (TPI)', () => {
    it('should convert TPI to metric pitch', () => {
      const result = tap({
        standard: 'unified',
        majorDiameter: 6.35, // 1/4 inch
        pitch: 20, // 20 TPI
      });

      // Pitch in mm = 25.4 / 20 = 1.27mm
      expect(result.threadHeight).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for invalid major diameter', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 0,
        pitch: 1.5,
      });

      expect(result.tapDrillSize).toBe(0);
      expect(result.threadPercentage).toBe(0);
    });

    it('should return zeros for invalid pitch', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 10,
        pitch: 0,
      });

      expect(result.tapDrillSize).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for fine pitch thread M8x1.0', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 8,
        pitch: 1.0,
        threadPercentage: 75,
      });

      expect(result.tapDrillSize).toBeCloseTo(7.0, 0);
    });

    it('should calculate for large thread M20x2.5', () => {
      const result = tap({
        standard: 'metric',
        majorDiameter: 20,
        pitch: 2.5,
        threadPercentage: 75,
      });

      expect(result.tapDrillSize).toBeCloseTo(17.5, 0);
    });
  });
});
