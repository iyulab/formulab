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
    it.each([
      ['there are no steps', []],
      ['a step has zero total', [{ total: 100, good: 90 }, { total: 0, good: 0 }]],
      ['a step has negative good units', [{ total: 100, good: -1 }]],
      ['a step has more good units than total', [{ total: 100, good: 101 }]],
    ])('throws RangeError when %s', (_label, steps) => {
      expect(() => yieldCalc({ steps })).toThrow(RangeError);
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

  describe('RTY cascade', () => {
    const result = yieldCalc({
      steps: [
        { total: 100, good: 95 },
        { total: 100, good: 90 },
        { total: 100, good: 98 },
      ],
    });

    it('takes each step first pass yield out of what earlier steps passed', () => {
      expect(result.cascade.map((s) => s.factor)).toEqual([0, 1, 2]);
      expect(result.cascade[0].change).toBeCloseTo(-5, 10);
      expect(result.cascade[1].change).toBeCloseTo(-9.5, 10);
      expect(result.cascade[2].change).toBeCloseTo(-1.71, 10);
    });

    it('lands on RTY, not on 100 minus the summed step losses', () => {
      const last = result.cascade[result.cascade.length - 1];
      expect(last.remaining).toBeCloseTo(83.79, 10);
      expect(result.rty).toBe(83.79);
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
