import { describe, it, expect } from 'vitest';
import { yieldCalc } from './yield.js';

describe('yieldCalc', () => {
  describe('First Pass Yield (FPY)', () => {
    it('should calculate FPY for single step', () => {
      const result = yieldCalc({
        steps: [{ total: 100, good: 95 }],
      });

      expect(result.fpyPerStep).toHaveLength(1);
      expect(result.fpyPerStep[0]).toBe(95);
    });

    it('should calculate FPY for multiple steps', () => {
      const result = yieldCalc({
        steps: [
          { total: 100, good: 95 },
          { total: 95, good: 90 },
          { total: 90, good: 85 },
        ],
      });

      expect(result.fpyPerStep).toHaveLength(3);
      expect(result.fpyPerStep[0]).toBe(95);
      expect(result.fpyPerStep[1]).toBeCloseTo(94.74, 1);
      expect(result.fpyPerStep[2]).toBeCloseTo(94.44, 1);
    });

    it('should calculate average FPY', () => {
      const result = yieldCalc({
        steps: [
          { total: 100, good: 90 },
          { total: 100, good: 80 },
        ],
      });

      expect(result.averageFpy).toBe(85); // (90 + 80) / 2
    });
  });

  describe('Rolled Throughput Yield (RTY)', () => {
    it('should calculate RTY as product of FPYs', () => {
      const result = yieldCalc({
        steps: [
          { total: 100, good: 90 }, // 90%
          { total: 90, good: 81 },  // 90%
        ],
      });

      // RTY = 0.9 × 0.9 = 0.81 = 81%
      expect(result.rty).toBe(81);
    });

    it('should show RTY is always <= lowest FPY', () => {
      const result = yieldCalc({
        steps: [
          { total: 100, good: 95 },
          { total: 95, good: 90 },
          { total: 90, good: 85 },
        ],
      });

      expect(result.rty).toBeLessThanOrEqual(Math.min(...result.fpyPerStep));
    });

    it('should calculate expected output based on RTY', () => {
      const result = yieldCalc({
        steps: [
          { total: 1000, good: 900 }, // 90%
          { total: 900, good: 810 },  // 90%
        ],
      });

      // Expected output = 1000 × 0.81 = 810
      expect(result.totalInput).toBe(1000);
      expect(result.expectedOutput).toBe(810);
    });
  });

  describe('edge cases', () => {
    it('should handle empty steps array', () => {
      const result = yieldCalc({ steps: [] });

      expect(result.fpyPerStep).toHaveLength(0);
      expect(result.averageFpy).toBe(0);
      expect(result.rty).toBe(0);
      expect(result.totalInput).toBe(0);
      expect(result.expectedOutput).toBe(0);
    });

    it('should handle zero total in a step', () => {
      const result = yieldCalc({
        steps: [
          { total: 100, good: 90 },
          { total: 0, good: 0 },
        ],
      });

      expect(result.fpyPerStep[1]).toBe(0);
      expect(result.rty).toBe(0);
    });

    it('should handle 100% yield', () => {
      const result = yieldCalc({
        steps: [
          { total: 100, good: 100 },
          { total: 100, good: 100 },
        ],
      });

      expect(result.fpyPerStep).toEqual([100, 100]);
      expect(result.rty).toBe(100);
      expect(result.averageFpy).toBe(100);
    });

    it('should handle very low yield', () => {
      const result = yieldCalc({
        steps: [
          { total: 100, good: 10 },
        ],
      });

      expect(result.fpyPerStep[0]).toBe(10);
      expect(result.rty).toBe(10);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate 5-step manufacturing process', () => {
      const result = yieldCalc({
        steps: [
          { total: 1000, good: 980 }, // 98%
          { total: 980, good: 960 },  // 97.96%
          { total: 960, good: 940 },  // 97.92%
          { total: 940, good: 920 },  // 97.87%
          { total: 920, good: 900 },  // 97.83%
        ],
      });

      expect(result.totalInput).toBe(1000);
      expect(result.expectedOutput).toBe(900);
      expect(result.rty).toBe(90);
    });
  });
});
