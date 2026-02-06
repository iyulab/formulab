import { describe, it, expect } from 'vitest';
import { oee } from './oee.js';

describe('oee', () => {
  describe('normal cases', () => {
    it('should calculate OEE correctly for typical production data', () => {
      const result = oee({
        rawData: {
          plannedTime: 480,      // 8 hours in minutes
          runTime: 420,          // 7 hours actual run
          totalCount: 1000,
          goodCount: 950,
          idealCycleTime: 0.4,   // 0.4 minutes per piece
        },
      });

      // Availability = 420/480 = 0.875
      expect(result.factors.availability).toBeCloseTo(0.875, 4);
      // Performance = (0.4 * 1000) / 420 = 0.952...
      expect(result.factors.performance).toBeCloseTo(0.9524, 3);
      // Quality = 950/1000 = 0.95
      expect(result.factors.quality).toBeCloseTo(0.95, 4);
      // OEE = 0.875 * 0.9524 * 0.95 = 0.7917...
      expect(result.factors.oee).toBeCloseTo(0.7917, 3);

      // Percentages
      expect(result.percentages.availability).toBeCloseTo(87.5, 2);
      expect(result.percentages.quality).toBeCloseTo(95, 2);
    });

    it('should return 100% OEE for perfect production', () => {
      const result = oee({
        rawData: {
          plannedTime: 100,
          runTime: 100,
          totalCount: 100,
          goodCount: 100,
          idealCycleTime: 1,
        },
      });

      expect(result.factors.availability).toBe(1);
      expect(result.factors.performance).toBe(1);
      expect(result.factors.quality).toBe(1);
      expect(result.factors.oee).toBe(1);
      expect(result.percentages.oee).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero plannedTime', () => {
      const result = oee({
        rawData: {
          plannedTime: 0,
          runTime: 100,
          totalCount: 100,
          goodCount: 100,
          idealCycleTime: 1,
        },
      });

      expect(result.factors.oee).toBe(0);
      expect(result.percentages.oee).toBe(0);
    });

    it('should return zeros for negative runTime', () => {
      const result = oee({
        rawData: {
          plannedTime: 100,
          runTime: -10,
          totalCount: 100,
          goodCount: 100,
          idealCycleTime: 1,
        },
      });

      expect(result.factors.oee).toBe(0);
    });

    it('should return zeros for zero idealCycleTime', () => {
      const result = oee({
        rawData: {
          plannedTime: 100,
          runTime: 100,
          totalCount: 100,
          goodCount: 100,
          idealCycleTime: 0,
        },
      });

      expect(result.factors.oee).toBe(0);
    });

    it('should handle zero totalCount (quality = 0)', () => {
      const result = oee({
        rawData: {
          plannedTime: 100,
          runTime: 100,
          totalCount: 0,
          goodCount: 0,
          idealCycleTime: 1,
        },
      });

      expect(result.factors.quality).toBe(0);
      expect(result.factors.oee).toBe(0);
    });
  });

  describe('performance exceeding 100%', () => {
    it('should allow performance > 1 when producing faster than ideal', () => {
      const result = oee({
        rawData: {
          plannedTime: 100,
          runTime: 100,
          totalCount: 200,         // produced 200 pieces
          goodCount: 200,
          idealCycleTime: 1,       // ideal: 1 min/piece = 100 pieces in 100 min
        },
      });

      // Performance = (1 * 200) / 100 = 2.0 (200%)
      expect(result.factors.performance).toBe(2);
      expect(result.percentages.performance).toBe(200);
    });
  });

  describe('input validation', () => {
    it('should throw error when goodCount > totalCount', () => {
      expect(() =>
        oee({
          rawData: {
            plannedTime: 100,
            runTime: 100,
            totalCount: 100,
            goodCount: 150, // invalid: more good than total
            idealCycleTime: 1,
          },
        })
      ).toThrow('goodCount (150) cannot exceed totalCount (100)');
    });

    it('should throw error when goodCount is negative', () => {
      expect(() =>
        oee({
          rawData: {
            plannedTime: 100,
            runTime: 100,
            totalCount: 100,
            goodCount: -10,
            idealCycleTime: 1,
          },
        })
      ).toThrow('goodCount (-10) cannot be negative');
    });
  });

  describe('Golden Reference Tests', () => {
    it('JIPM handbook example: typical production line', () => {
      // JIPM TPM handbook scenario:
      // Shift: 480 min, Downtime: 48 min → RunTime=432
      // Ideal cycle: 0.456 min/piece, Total produced: 1000
      // Good: 990
      const result = oee({
        rawData: {
          plannedTime: 480,
          runTime: 432,
          totalCount: 1000,
          goodCount: 990,
          idealCycleTime: 0.456,
        },
      });

      // Availability = 432/480 = 0.9
      expect(result.factors.availability).toBeCloseTo(0.9, 4);
      // Performance = (0.456 × 1000) / 432 = 1.0556 (exceeds 100% due to faster cycle)
      expect(result.factors.performance).toBeCloseTo(1.0556, 3);
      // Quality = 990/1000 = 0.99
      expect(result.factors.quality).toBeCloseTo(0.99, 4);
      // OEE = 0.9 × 1.0556 × 0.99 ≈ 0.9405
      expect(result.percentages.oee).toBeCloseTo(94.1, 0);
    });

    it('World-class benchmark: A≥90%, P≥95%, Q≥99.9%', () => {
      // World-class OEE targets per JIPM/Nakajima
      const result = oee({
        rawData: {
          plannedTime: 480,
          runTime: 432,          // A = 90%
          totalCount: 950,
          goodCount: 949,        // Q ≈ 99.89%
          idealCycleTime: 0.432, // P = (0.432 × 950) / 432 = 0.9500
        },
      });

      expect(result.factors.availability).toBeCloseTo(0.9, 4);
      expect(result.factors.performance).toBeCloseTo(0.95, 2);
      expect(result.factors.quality).toBeCloseTo(0.9989, 3);
      // OEE ≈ 0.9 × 0.95 × 0.9989 ≈ 0.854
      expect(result.percentages.oee).toBeCloseTo(85.4, 0);
    });

    it('Perfect production: all factors 100%', () => {
      const result = oee({
        rawData: {
          plannedTime: 480,
          runTime: 480,
          totalCount: 1000,
          goodCount: 1000,
          idealCycleTime: 0.48, // exactly 1000 pieces in 480 min
        },
      });

      expect(result.factors.availability).toBe(1);
      expect(result.factors.performance).toBe(1);
      expect(result.factors.quality).toBe(1);
      expect(result.factors.oee).toBe(1);
      expect(result.percentages.oee).toBe(100);
    });
  });
});
