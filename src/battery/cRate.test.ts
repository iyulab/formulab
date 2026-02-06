import { describe, it, expect } from 'vitest';
import { cRate } from './cRate.js';

describe('cRate', () => {
  describe('currentToRate', () => {
    it('should convert current to C-rate: 10A on 100Ah = 0.1C', () => {
      const result = cRate({ mode: 'currentToRate', capacityAh: 100, currentA: 10 });
      expect(result.cRate).toBeCloseTo(0.1, 4);
      expect(result.currentA).toBeCloseTo(10, 2);
      expect(result.theoreticalTimeH).toBeCloseTo(10, 1);
      expect(result.theoreticalTimeMin).toBeCloseTo(600, 0);
    });

    it('should handle 1C rate: 50A on 50Ah', () => {
      const result = cRate({ mode: 'currentToRate', capacityAh: 50, currentA: 50 });
      expect(result.cRate).toBeCloseTo(1, 4);
      expect(result.theoreticalTimeH).toBeCloseTo(1, 1);
    });

    it('should handle high C-rate: 100A on 10Ah = 10C', () => {
      const result = cRate({ mode: 'currentToRate', capacityAh: 10, currentA: 100 });
      expect(result.cRate).toBeCloseTo(10, 4);
      expect(result.theoreticalTimeH).toBeCloseTo(0.1, 2);
      expect(result.theoreticalTimeMin).toBeCloseTo(6, 1);
    });
  });

  describe('rateToCurrent', () => {
    it('should convert C-rate to current: 0.5C on 100Ah = 50A', () => {
      const result = cRate({ mode: 'rateToCurrent', capacityAh: 100, cRate: 0.5 });
      expect(result.cRate).toBeCloseTo(0.5, 4);
      expect(result.currentA).toBeCloseTo(50, 2);
      expect(result.theoreticalTimeH).toBeCloseTo(2, 1);
    });

    it('should handle 2C rate: 2C on 50Ah = 100A', () => {
      const result = cRate({ mode: 'rateToCurrent', capacityAh: 50, cRate: 2 });
      expect(result.currentA).toBeCloseTo(100, 2);
      expect(result.theoreticalTimeH).toBeCloseTo(0.5, 2);
      expect(result.theoreticalTimeMin).toBeCloseTo(30, 1);
    });

    it('should handle C/20 rate: 0.05C on 200Ah = 10A', () => {
      const result = cRate({ mode: 'rateToCurrent', capacityAh: 200, cRate: 0.05 });
      expect(result.currentA).toBeCloseTo(10, 2);
      expect(result.theoreticalTimeH).toBeCloseTo(20, 1);
    });
  });
});
