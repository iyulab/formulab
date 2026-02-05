import { describe, it, expect } from 'vitest';
import { dimWeight } from './dimWeight.js';

describe('dimWeight', () => {
  describe('domestic air shipping', () => {
    it('should calculate dimensional weight correctly', () => {
      // 50x40x30 cm = 60,000 cm³ / 5000 = 12 kg dim weight
      const result = dimWeight({
        length: 50,
        width: 40,
        height: 30,
        actualWeight: 5,
        carrier: 'domestic_air',
      });

      expect(result.dimensionalWeight).toBe(12);
      expect(result.dimFactor).toBe(5000);
    });

    it('should use dimensional weight as billable when higher', () => {
      const result = dimWeight({
        length: 50,
        width: 40,
        height: 30,
        actualWeight: 5, // Actual weight is lower
        carrier: 'domestic_air',
      });

      expect(result.billableWeight).toBe(12); // Uses dim weight
      expect(result.isDimWeightHigher).toBe(true);
    });

    it('should use actual weight as billable when higher', () => {
      const result = dimWeight({
        length: 50,
        width: 40,
        height: 30,
        actualWeight: 15, // Actual weight is higher
        carrier: 'domestic_air',
      });

      expect(result.billableWeight).toBe(15); // Uses actual weight
      expect(result.isDimWeightHigher).toBe(false);
    });
  });

  describe('international air shipping', () => {
    it('should use higher DIM factor (6000)', () => {
      // Same box: 60,000 cm³ / 6000 = 10 kg dim weight
      const result = dimWeight({
        length: 50,
        width: 40,
        height: 30,
        actualWeight: 5,
        carrier: 'international_air',
      });

      expect(result.dimensionalWeight).toBe(10);
      expect(result.dimFactor).toBe(6000);
    });

    it('should result in lower dim weight than domestic air', () => {
      const domestic = dimWeight({
        length: 50,
        width: 40,
        height: 30,
        actualWeight: 5,
        carrier: 'domestic_air',
      });

      const international = dimWeight({
        length: 50,
        width: 40,
        height: 30,
        actualWeight: 5,
        carrier: 'international_air',
      });

      expect(international.dimensionalWeight).toBeLessThan(domestic.dimensionalWeight);
    });
  });

  describe('ground shipping', () => {
    it('should use same DIM factor as domestic air (5000)', () => {
      const result = dimWeight({
        length: 50,
        width: 40,
        height: 30,
        actualWeight: 5,
        carrier: 'ground',
      });

      expect(result.dimensionalWeight).toBe(12);
      expect(result.dimFactor).toBe(5000);
    });
  });

  describe('edge cases', () => {
    it('should handle zero length', () => {
      const result = dimWeight({
        length: 0,
        width: 40,
        height: 30,
        actualWeight: 5,
        carrier: 'domestic_air',
      });

      expect(result.dimensionalWeight).toBe(0);
      expect(result.billableWeight).toBe(0);
      expect(result.isDimWeightHigher).toBe(false);
    });

    it('should handle zero width', () => {
      const result = dimWeight({
        length: 50,
        width: 0,
        height: 30,
        actualWeight: 5,
        carrier: 'domestic_air',
      });

      expect(result.dimensionalWeight).toBe(0);
      expect(result.billableWeight).toBe(0);
    });

    it('should handle zero height', () => {
      const result = dimWeight({
        length: 50,
        width: 40,
        height: 0,
        actualWeight: 5,
        carrier: 'domestic_air',
      });

      expect(result.dimensionalWeight).toBe(0);
      expect(result.billableWeight).toBe(0);
    });

    it('should handle negative dimensions', () => {
      const result = dimWeight({
        length: -10,
        width: 40,
        height: 30,
        actualWeight: 5,
        carrier: 'domestic_air',
      });

      expect(result.dimensionalWeight).toBe(0);
      expect(result.billableWeight).toBe(0);
    });

    it('should handle negative actual weight', () => {
      const result = dimWeight({
        length: 50,
        width: 40,
        height: 30,
        actualWeight: -5,
        carrier: 'domestic_air',
      });

      expect(result.dimensionalWeight).toBe(0);
      expect(result.actualWeight).toBe(0);
    });
  });

  describe('equal weights scenario', () => {
    it('should handle equal dim and actual weight', () => {
      // 50x40x30 = 60000 cm³ / 5000 = 12 kg
      const result = dimWeight({
        length: 50,
        width: 40,
        height: 30,
        actualWeight: 12, // Equal to dim weight
        carrier: 'domestic_air',
      });

      expect(result.dimensionalWeight).toBe(12);
      expect(result.actualWeight).toBe(12);
      expect(result.billableWeight).toBe(12);
      expect(result.isDimWeightHigher).toBe(false);
    });
  });

  describe('real-world examples', () => {
    it('should calculate for a small package', () => {
      // Small box: 20x15x10 cm = 3000 cm³ / 5000 = 0.6 kg
      const result = dimWeight({
        length: 20,
        width: 15,
        height: 10,
        actualWeight: 2,
        carrier: 'domestic_air',
      });

      expect(result.dimensionalWeight).toBe(0.6);
      expect(result.billableWeight).toBe(2); // Actual weight is higher
      expect(result.isDimWeightHigher).toBe(false);
    });

    it('should calculate for a large lightweight package', () => {
      // Large box: 100x80x60 cm = 480,000 cm³ / 5000 = 96 kg
      const result = dimWeight({
        length: 100,
        width: 80,
        height: 60,
        actualWeight: 10,
        carrier: 'domestic_air',
      });

      expect(result.dimensionalWeight).toBe(96);
      expect(result.billableWeight).toBe(96); // Dim weight is much higher
      expect(result.isDimWeightHigher).toBe(true);
    });
  });
});
