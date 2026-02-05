import { describe, it, expect } from 'vitest';
import { havsCalculate } from './havsCalculate.js';

describe('havsCalculate', () => {
  describe('A(8) calculation', () => {
    it('should calculate A(8) for single tool exposure', () => {
      // A(8) = a_hv × sqrt(T / 8)
      // For 5 m/s² for 2 hours: A(8) = 5 × sqrt(2/8) = 5 × 0.5 = 2.5
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 5, exposureTime: 2 }],
      });

      expect(result.a8).toBeCloseTo(2.5, 2);
    });

    it('should calculate A(8) for multiple tool exposures', () => {
      // A(8) = sqrt(sum(A_partial²))
      const result = havsCalculate({
        tools: [
          { vibrationMagnitude: 5, exposureTime: 2 },  // 2.5
          { vibrationMagnitude: 10, exposureTime: 1 }, // 3.54
        ],
      });

      // sqrt(2.5² + 3.54²) = sqrt(6.25 + 12.5) = sqrt(18.75) ≈ 4.33
      expect(result.a8).toBeCloseTo(4.33, 1);
    });

    it('should return partial exposures for each tool', () => {
      const result = havsCalculate({
        tools: [
          { vibrationMagnitude: 5, exposureTime: 2 },
          { vibrationMagnitude: 10, exposureTime: 1 },
        ],
      });

      expect(result.partialExposures).toHaveLength(2);
      expect(result.partialExposures[0]).toBeCloseTo(2.5, 2);
      expect(result.partialExposures[1]).toBeCloseTo(3.54, 1);
    });
  });

  describe('exposure limits', () => {
    it('should calculate percentage of EAV (2.5 m/s²)', () => {
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 5, exposureTime: 2 }],
      });

      // A(8) = 2.5, EAV = 2.5, so 100%
      expect(result.percentEAV).toBeCloseTo(100, 0);
    });

    it('should calculate percentage of ELV (5.0 m/s²)', () => {
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 5, exposureTime: 2 }],
      });

      // A(8) = 2.5, ELV = 5.0, so 50%
      expect(result.percentELV).toBeCloseTo(50, 0);
    });

    it('should calculate exposure points', () => {
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 5, exposureTime: 2 }],
      });

      // Points = (A(8) / EAV)² × 100 = (2.5/2.5)² × 100 = 100
      expect(result.exposurePoints).toBeCloseTo(100, 0);
    });
  });

  describe('status determination', () => {
    it('should be safe when A(8) < EAV (2.5)', () => {
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 3, exposureTime: 1 }],
      });

      // A(8) = 3 × sqrt(1/8) = 1.06
      expect(result.a8).toBeLessThan(2.5);
      expect(result.status).toBe('safe');
    });

    it('should require action when EAV <= A(8) < ELV', () => {
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 5, exposureTime: 2 }],
      });

      // A(8) = 2.5 (exactly at EAV)
      expect(result.a8).toBeCloseTo(2.5, 1);
      expect(result.status).toBe('action');
    });

    it('should be at limit when A(8) >= ELV (5.0)', () => {
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 10, exposureTime: 2 }],
      });

      // A(8) = 10 × sqrt(2/8) = 5.0
      expect(result.a8).toBeCloseTo(5, 1);
      expect(result.status).toBe('limit');
    });
  });

  describe('max daily exposure', () => {
    it('should calculate maximum safe daily exposure time', () => {
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 5, exposureTime: 2 }],
      });

      // T_max = 8 × (2.5² / 5²) = 8 × 0.25 = 2 hours
      expect(result.maxDailyExposure).toBeCloseTo(2, 1);
    });

    it('should cap max exposure at 8 hours', () => {
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 1, exposureTime: 1 }],
      });

      expect(result.maxDailyExposure).toBeLessThanOrEqual(8);
    });
  });

  describe('edge cases', () => {
    it('should handle empty tools array', () => {
      const result = havsCalculate({
        tools: [],
      });

      expect(result.a8).toBe(0);
      expect(result.partialExposures).toHaveLength(0);
      expect(result.status).toBe('safe');
    });

    it('should filter out zero vibration tools', () => {
      const result = havsCalculate({
        tools: [
          { vibrationMagnitude: 0, exposureTime: 4 },
          { vibrationMagnitude: 5, exposureTime: 2 },
        ],
      });

      expect(result.partialExposures).toHaveLength(1);
      expect(result.a8).toBeCloseTo(2.5, 2);
    });

    it('should filter out zero exposure time', () => {
      const result = havsCalculate({
        tools: [
          { vibrationMagnitude: 5, exposureTime: 0 },
          { vibrationMagnitude: 5, exposureTime: 2 },
        ],
      });

      expect(result.partialExposures).toHaveLength(1);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate angle grinder exposure', () => {
      const result = havsCalculate({
        tools: [{ vibrationMagnitude: 8, exposureTime: 3 }],
      });

      // A(8) = 8 × sqrt(3/8) = 4.9
      expect(result.a8).toBeCloseTo(4.9, 1);
      expect(result.status).toBe('action');
    });

    it('should calculate mixed tool usage', () => {
      const result = havsCalculate({
        tools: [
          { vibrationMagnitude: 12, exposureTime: 0.5 }, // Impact wrench
          { vibrationMagnitude: 6, exposureTime: 2 },    // Grinder
          { vibrationMagnitude: 3, exposureTime: 4 },    // Drill
        ],
      });

      expect(result.partialExposures).toHaveLength(3);
      expect(result.status).not.toBe('safe');
    });
  });
});
