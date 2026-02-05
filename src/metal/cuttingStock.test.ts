import { describe, it, expect } from 'vitest';
import { cuttingStock } from './cuttingStock.js';

describe('cuttingStock', () => {
  describe('basic FFD algorithm', () => {
    it('should cut simple pieces from stock', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 3,
        pieces: [
          { length: 1000, quantity: 4 },
        ],
        algorithm: 'ffd',
      });

      expect(result).not.toBeNull();
      expect(result!.stocksUsed).toBeGreaterThan(0);
      expect(result!.patterns.length).toBeGreaterThan(0);
    });

    it('should minimize stocks used', () => {
      // 3 x 1990 + 2 kerfs = 5970 + 6 = 5976 < 6000
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 3,
        pieces: [
          { length: 1990, quantity: 3 },
        ],
        algorithm: 'ffd',
      });

      // 3 pieces of 1990mm with kerf fit in one 6000mm stock
      expect(result!.stocksUsed).toBe(1);
    });

    it('should account for kerf loss', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 3,
        pieces: [
          { length: 1997, quantity: 3 }, // 3 x 1997 + 2 kerfs = 5991 + 6 = 5997
        ],
        algorithm: 'ffd',
      });

      expect(result!.stocksUsed).toBe(1);
      expect(result!.totalKerfLoss).toBe(6); // 2 kerfs x 3mm
    });
  });

  describe('BFD algorithm', () => {
    it('should work with best fit decreasing', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 3,
        pieces: [
          { length: 1500, quantity: 2 },
          { length: 2000, quantity: 2 },
        ],
        algorithm: 'bfd',
      });

      expect(result).not.toBeNull();
      expect(result!.stocksUsed).toBeGreaterThan(0);
    });
  });

  describe('utilization metrics', () => {
    it('should calculate waste percentage', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 3,
        pieces: [
          { length: 2500, quantity: 2 },
        ],
        algorithm: 'ffd',
      });

      expect(result!.wastePercent).toBeGreaterThan(0);
      expect(result!.utilizationPercent).toBeLessThan(100);
    });

    it('should report total waste', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 3,
        pieces: [
          { length: 1000, quantity: 5 },
        ],
        algorithm: 'ffd',
      });

      expect(result!.totalWaste).toBeGreaterThan(0);
    });
  });

  describe('pattern details', () => {
    it('should provide detailed patterns', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 3,
        pieces: [
          { length: 1500, quantity: 3, label: 'A' },
          { length: 1000, quantity: 2, label: 'B' },
        ],
        algorithm: 'ffd',
      });

      expect(result!.patterns.length).toBeGreaterThan(0);
      expect(result!.patterns[0].pieces.length).toBeGreaterThan(0);
      expect(result!.patterns[0].usedLength).toBeGreaterThan(0);
      expect(result!.patterns[0].wastePercent).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should return null for empty pieces', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 3,
        pieces: [],
        algorithm: 'ffd',
      });

      expect(result).toBeNull();
    });

    it('should return null when piece exceeds stock length', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 3,
        pieces: [
          { length: 7000, quantity: 1 },
        ],
        algorithm: 'ffd',
      });

      expect(result).toBeNull();
    });

    it('should handle zero kerf', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 0,
        pieces: [
          { length: 2000, quantity: 3 },
        ],
        algorithm: 'ffd',
      });

      expect(result!.totalKerfLoss).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should optimize lumber cutting', () => {
      const result = cuttingStock({
        stockLength: 2440, // 8ft lumber in mm
        kerf: 3,
        pieces: [
          { length: 600, quantity: 8 },
          { length: 400, quantity: 4 },
        ],
        algorithm: 'bfd',
      });

      expect(result!.utilizationPercent).toBeGreaterThan(70);
    });

    it('should optimize steel bar cutting', () => {
      const result = cuttingStock({
        stockLength: 6000,
        kerf: 5, // Larger kerf for steel
        pieces: [
          { length: 1200, quantity: 10 },
          { length: 800, quantity: 15 },
        ],
        algorithm: 'bfd',
      });

      expect(result!.stocksUsed).toBeGreaterThan(0);
      expect(result!.patterns.length).toBeGreaterThan(0);
    });
  });
});
