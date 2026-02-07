import { describe, it, expect } from 'vitest';
import { stabilityStudy } from './stabilityStudy.js';

describe('stabilityStudy', () => {
  // Typical accelerated stability data: 3 temperatures
  const typicalData = [
    // 40°C
    { temperature: 40, time: 1, degradation: 2 },
    { temperature: 40, time: 3, degradation: 6 },
    { temperature: 40, time: 6, degradation: 12 },
    // 50°C
    { temperature: 50, time: 1, degradation: 4 },
    { temperature: 50, time: 3, degradation: 12 },
    { temperature: 50, time: 6, degradation: 24 },
    // 60°C
    { temperature: 60, time: 1, degradation: 8 },
    { temperature: 60, time: 3, degradation: 24 },
    { temperature: 60, time: 6, degradation: 48 },
  ];

  describe('Arrhenius regression', () => {
    it('should calculate activation energy', () => {
      const result = stabilityStudy({
        dataPoints: typicalData,
        shelfLifeCriterion: 10,
        storageTemp: 25,
      });

      expect(result.activationEnergy).toBeGreaterThan(0);
    });

    it('should have good R² for consistent data', () => {
      const result = stabilityStudy({
        dataPoints: typicalData,
        shelfLifeCriterion: 10,
        storageTemp: 25,
      });

      expect(result.r2).toBeGreaterThan(0.9);
    });
  });

  describe('shelf life prediction', () => {
    it('should predict shelf life at storage temperature', () => {
      const result = stabilityStudy({
        dataPoints: typicalData,
        shelfLifeCriterion: 10,
        storageTemp: 25,
      });

      expect(result.predictedShelfLife).toBeGreaterThan(0);
      // At 25°C, shelf life should be longer than at 40°C
      // At 40°C, k≈2 → SL=10/2=5 months
      // At 25°C, should be > 5
      expect(result.predictedShelfLife).toBeGreaterThan(5);
    });

    it('should predict shorter shelf life at higher temperatures', () => {
      const hot = stabilityStudy({
        dataPoints: typicalData,
        shelfLifeCriterion: 10,
        storageTemp: 30,
      });
      const cold = stabilityStudy({
        dataPoints: typicalData,
        shelfLifeCriterion: 10,
        storageTemp: 20,
      });

      expect(cold.predictedShelfLife).toBeGreaterThan(hot.predictedShelfLife);
    });
  });

  describe('Q10', () => {
    it('should calculate Q10 > 1', () => {
      const result = stabilityStudy({
        dataPoints: typicalData,
        shelfLifeCriterion: 10,
        storageTemp: 25,
      });

      expect(result.q10).toBeGreaterThan(1);
    });

    it('should have Q10 in typical range (1.5-4)', () => {
      const result = stabilityStudy({
        dataPoints: typicalData,
        shelfLifeCriterion: 10,
        storageTemp: 25,
      });

      expect(result.q10).toBeGreaterThan(1);
      expect(result.q10).toBeLessThan(10);
    });
  });

  describe('rate constants', () => {
    it('should calculate rate constants for each temperature', () => {
      const result = stabilityStudy({
        dataPoints: typicalData,
        shelfLifeCriterion: 10,
        storageTemp: 25,
      });

      expect(result.rateConstants).toHaveLength(3);
      // Rate constants should increase with temperature
      const sorted = [...result.rateConstants].sort((a, b) => a.temperature - b.temperature);
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i].rateConstant).toBeGreaterThan(sorted[i - 1].rateConstant);
      }
    });
  });

  describe('acceleration factor', () => {
    it('should be > 1 when max test temp > storage temp', () => {
      const result = stabilityStudy({
        dataPoints: typicalData,
        shelfLifeCriterion: 10,
        storageTemp: 25,
      });

      expect(result.accelerationFactor).toBeGreaterThan(1);
    });
  });

  describe('edge cases', () => {
    it('should handle single temperature (insufficient for regression)', () => {
      const result = stabilityStudy({
        dataPoints: [
          { temperature: 40, time: 1, degradation: 2 },
          { temperature: 40, time: 3, degradation: 6 },
        ],
        shelfLifeCriterion: 10,
        storageTemp: 25,
      });

      expect(result.activationEnergy).toBe(0);
      expect(result.q10).toBe(1);
    });
  });
});
