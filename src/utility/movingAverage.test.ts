import { describe, it, expect } from 'vitest';
import { movingAverage } from './movingAverage.js';

describe('movingAverage', () => {
  describe('SMA', () => {
    it('should calculate simple moving average', () => {
      const result = movingAverage({
        data: [1, 2, 3, 4, 5],
        window: 3,
        method: 'sma',
      });
      expect(result).not.toBeNull();
      expect(result!.values).toHaveLength(3);
      expect(result!.values[0]).toBe(2); // (1+2+3)/3
      expect(result!.values[1]).toBe(3); // (2+3+4)/3
      expect(result!.values[2]).toBe(4); // (3+4+5)/3
    });

    it('should handle window equal to data length', () => {
      const result = movingAverage({
        data: [2, 4, 6],
        window: 3,
        method: 'sma',
      });
      expect(result!.values).toHaveLength(1);
      expect(result!.values[0]).toBe(4);
    });

    it('should handle window of 1', () => {
      const result = movingAverage({
        data: [1, 2, 3],
        window: 1,
        method: 'sma',
      });
      expect(result!.values).toEqual([1, 2, 3]);
    });
  });

  describe('EMA', () => {
    it('should calculate exponential moving average', () => {
      const result = movingAverage({
        data: [1, 2, 3, 4, 5],
        window: 3,
        method: 'ema',
      });
      expect(result).not.toBeNull();
      expect(result!.values).toHaveLength(3);
      expect(result!.values[0]).toBe(2); // SMA(1,2,3) = 2
      expect(result!.values[1]).toBeCloseTo(3, 4); // 4*0.5 + 2*0.5 = 3
      expect(result!.values[2]).toBeCloseTo(4, 4); // 5*0.5 + 3*0.5 = 4
    });

    it('should weight recent values more heavily', () => {
      const result = movingAverage({
        data: [10, 10, 10, 10, 20],
        window: 3,
        method: 'ema',
      });
      const last = result!.values[result!.values.length - 1];
      // EMA reacts faster than SMA to the jump
      expect(last).toBeGreaterThan(10);
      expect(last).toBeLessThan(20);
    });
  });

  it('should return null for empty data', () => {
    expect(movingAverage({ data: [], window: 3, method: 'sma' })).toBeNull();
  });

  it('should return null for window larger than data', () => {
    expect(movingAverage({ data: [1, 2], window: 3, method: 'sma' })).toBeNull();
  });

  it('should return null for window < 1', () => {
    expect(movingAverage({ data: [1, 2, 3], window: 0, method: 'sma' })).toBeNull();
  });
});
