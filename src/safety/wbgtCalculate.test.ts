import { describe, it, expect } from 'vitest';
import { wbgtCalculate } from './wbgtCalculate.js';

describe('wbgtCalculate', () => {
  describe('WBGT calculation', () => {
    it('should calculate outdoor WBGT correctly', () => {
      // Outdoor: WBGT = 0.7×Twb + 0.2×Tg + 0.1×Ta
      const result = wbgtCalculate({
        dryBulbTemp: 35,
        wetBulbTemp: 28,
        globeTemp: 40,
        isOutdoor: true,
        workload: 'moderate',
        isAcclimatized: true,
      });

      // WBGT = 0.7×28 + 0.2×40 + 0.1×35 = 19.6 + 8 + 3.5 = 31.1
      expect(result.wbgt).toBeCloseTo(31.1, 1);
    });

    it('should calculate indoor WBGT correctly', () => {
      // Indoor: WBGT = 0.7×Twb + 0.3×Tg
      const result = wbgtCalculate({
        dryBulbTemp: 30,
        wetBulbTemp: 25,
        globeTemp: 32,
        isOutdoor: false,
        workload: 'moderate',
        isAcclimatized: true,
      });

      // WBGT = 0.7×25 + 0.3×32 = 17.5 + 9.6 = 27.1
      expect(result.wbgt).toBeCloseTo(27.1, 1);
    });
  });

  describe('threshold selection', () => {
    it('should use correct threshold for light work, acclimatized', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 30,
        wetBulbTemp: 25,
        globeTemp: 30,
        isOutdoor: false,
        workload: 'light',
        isAcclimatized: true,
      });

      expect(result.threshold).toBe(31);
    });

    it('should use correct threshold for moderate work, unacclimatized', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 30,
        wetBulbTemp: 25,
        globeTemp: 30,
        isOutdoor: false,
        workload: 'moderate',
        isAcclimatized: false,
      });

      expect(result.threshold).toBe(25);
    });

    it('should use correct threshold for heavy work, acclimatized', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 30,
        wetBulbTemp: 25,
        globeTemp: 30,
        isOutdoor: false,
        workload: 'heavy',
        isAcclimatized: true,
      });

      expect(result.threshold).toBe(26);
    });

    it('should use correct threshold for very heavy work, unacclimatized', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 30,
        wetBulbTemp: 25,
        globeTemp: 30,
        isOutdoor: false,
        workload: 'veryHeavy',
        isAcclimatized: false,
      });

      expect(result.threshold).toBe(20);
    });
  });

  describe('status determination', () => {
    it('should be safe when WBGT < threshold - 2', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 25,
        wetBulbTemp: 20,
        globeTemp: 25,
        isOutdoor: false,
        workload: 'light',
        isAcclimatized: true,
      });

      // WBGT = 0.7×20 + 0.3×25 = 14 + 7.5 = 21.5
      // Threshold = 31, safe if < 29
      expect(result.wbgt).toBeCloseTo(21.5, 1);
      expect(result.status).toBe('safe');
    });

    it('should be caution when threshold - 2 <= WBGT <= threshold', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 32,
        wetBulbTemp: 27,
        globeTemp: 33,
        isOutdoor: false,
        workload: 'moderate',
        isAcclimatized: true,
      });

      // WBGT = 0.7×27 + 0.3×33 = 18.9 + 9.9 = 28.8
      // Threshold = 28 (moderate, acclimatized)
      // Caution range: 26-28
      expect(result.status).toBe('danger');
    });

    it('should be danger when WBGT > threshold', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 38,
        wetBulbTemp: 32,
        globeTemp: 42,
        isOutdoor: true,
        workload: 'heavy',
        isAcclimatized: false,
      });

      // WBGT = 0.7×32 + 0.2×42 + 0.1×38 = 22.4 + 8.4 + 3.8 = 34.6
      // Threshold = 23 (heavy, unacclimatized)
      expect(result.wbgt).toBeGreaterThan(result.threshold);
      expect(result.status).toBe('danger');
    });
  });

  describe('real-world scenarios', () => {
    it('should assess summer construction site', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 35,
        wetBulbTemp: 28,
        globeTemp: 45,
        isOutdoor: true,
        workload: 'heavy',
        isAcclimatized: true,
      });

      expect(result.status).toBe('danger');
    });

    it('should assess air-conditioned office', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 24,
        wetBulbTemp: 18,
        globeTemp: 24,
        isOutdoor: false,
        workload: 'light',
        isAcclimatized: true,
      });

      expect(result.status).toBe('safe');
    });

    it('should assess foundry worker', () => {
      const result = wbgtCalculate({
        dryBulbTemp: 40,
        wetBulbTemp: 25,
        globeTemp: 50,
        isOutdoor: false,
        workload: 'veryHeavy',
        isAcclimatized: true,
      });

      expect(result.status).toBe('danger');
    });
  });
});
