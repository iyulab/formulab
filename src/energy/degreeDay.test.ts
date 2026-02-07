import { describe, it, expect } from 'vitest';
import { degreeDay } from './degreeDay.js';

describe('degreeDay', () => {
  describe('HDD calculation', () => {
    it('should calculate HDD correctly', () => {
      // 3 days at 10°C, base=18 → HDD = 3 × (18-10) = 24
      const result = degreeDay({ dailyTemps: [10, 10, 10] });
      expect(result.hdd).toBe(24);
      expect(result.heatingDays).toBe(3);
    });

    it('should not count HDD when temp >= base', () => {
      const result = degreeDay({ dailyTemps: [20, 22, 18] });
      expect(result.hdd).toBe(0);
    });
  });

  describe('CDD calculation', () => {
    it('should calculate CDD correctly', () => {
      // 2 days at 30°C, base=24 → CDD = 2 × (30-24) = 12
      const result = degreeDay({ dailyTemps: [30, 30] });
      expect(result.cdd).toBe(12);
      expect(result.coolingDays).toBe(2);
    });

    it('should not count CDD when temp <= base', () => {
      const result = degreeDay({ dailyTemps: [20, 22, 24] });
      expect(result.cdd).toBe(0);
    });
  });

  describe('mixed seasons', () => {
    it('should count both heating and cooling days', () => {
      // Winter, neutral, summer
      const result = degreeDay({ dailyTemps: [5, 20, 30] });

      expect(result.hdd).toBeCloseTo(13, 1); // 18-5=13
      expect(result.cdd).toBeCloseTo(6, 1);  // 30-24=6
      expect(result.heatingDays).toBe(1);
      expect(result.coolingDays).toBe(1);
      expect(result.neutralDays).toBe(1);
    });
  });

  describe('custom base temperatures', () => {
    it('should use custom heating base', () => {
      const result = degreeDay({ dailyTemps: [14], baseHeating: 15 });
      expect(result.hdd).toBe(1);
    });

    it('should use custom cooling base', () => {
      const result = degreeDay({ dailyTemps: [26], baseCooling: 25 });
      expect(result.cdd).toBe(1);
    });
  });

  describe('average temperature', () => {
    it('should compute average temperature', () => {
      const result = degreeDay({ dailyTemps: [10, 20, 30] });
      expect(result.avgTemp).toBe(20);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array', () => {
      const result = degreeDay({ dailyTemps: [] });
      expect(result.hdd).toBe(0);
      expect(result.cdd).toBe(0);
      expect(result.totalDays).toBe(0);
    });

    it('should handle single day', () => {
      const result = degreeDay({ dailyTemps: [10] });
      expect(result.hdd).toBe(8);
      expect(result.totalDays).toBe(1);
    });
  });
});
