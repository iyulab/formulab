import { describe, it, expect } from 'vitest';
import { weldHeat } from './weldHeat.js';

describe('weldHeat', () => {
  describe('heat input calculation', () => {
    it('should calculate heat input for GMAW', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 300, // mm/min
        baseMetal: 'mildSteel',
        thickness: 10,
      });

      expect(result.heatInput).toBeGreaterThan(0);
      expect(result.efficiency).toBe(0.85);
    });

    it('should calculate heat input for GTAW', () => {
      const result = weldHeat({
        process: 'gtaw',
        voltage: 15,
        current: 150,
        travelSpeed: 150,
        baseMetal: 'stainlessSteel',
        thickness: 5,
      });

      expect(result.heatInput).toBeGreaterThan(0);
      expect(result.efficiency).toBe(0.58);
    });

    it('should calculate heat input for SMAW', () => {
      const result = weldHeat({
        process: 'smaw',
        voltage: 24,
        current: 120,
        travelSpeed: 200,
        baseMetal: 'mildSteel',
        thickness: 8,
      });

      expect(result.efficiency).toBe(0.72);
    });

    it('should calculate heat input for SAW', () => {
      const result = weldHeat({
        process: 'saw',
        voltage: 32,
        current: 500,
        travelSpeed: 600,
        baseMetal: 'mildSteel',
        thickness: 20,
      });

      expect(result.efficiency).toBe(0.90);
    });
  });

  describe('carbon equivalent calculation', () => {
    it('should calculate CE for mild steel', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 300,
        baseMetal: 'mildSteel',
        thickness: 10,
      });

      expect(result.carbonEquivalent).toBeGreaterThan(0);
      expect(result.carbonEquivalent).toBeLessThan(0.5);
    });

    it('should calculate higher CE for low alloy steel', () => {
      const mild = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 300,
        baseMetal: 'mildSteel',
        thickness: 10,
      });

      const lowAlloy = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 300,
        baseMetal: 'lowAlloySteel',
        thickness: 10,
      });

      expect(lowAlloy.carbonEquivalent).toBeGreaterThan(mild.carbonEquivalent);
    });
  });

  describe('cracking risk assessment', () => {
    it('should assess low cracking risk for mild steel', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 300,
        baseMetal: 'mildSteel',
        thickness: 10,
      });

      expect(result.crackingRisk).toBe('low');
    });

    it('should assess higher risk for cast iron', () => {
      const result = weldHeat({
        process: 'smaw',
        voltage: 22,
        current: 100,
        travelSpeed: 150,
        baseMetal: 'castIron',
        thickness: 15,
      });

      expect(['high', 'veryHigh']).toContain(result.crackingRisk);
    });
  });

  describe('preheat recommendations', () => {
    it('should recommend preheat for thick low alloy steel', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 28,
        current: 250,
        travelSpeed: 300,
        baseMetal: 'lowAlloySteel',
        thickness: 30,
      });

      expect(result.preheatTemp.min).toBeGreaterThan(20);
    });

    it('should not require preheat for thin mild steel', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 20,
        current: 150,
        travelSpeed: 300,
        baseMetal: 'mildSteel',
        thickness: 5,
      });

      expect(result.preheatTemp.min).toBeLessThanOrEqual(20);
    });
  });

  describe('interpass temperature', () => {
    it('should recommend low interpass for stainless', () => {
      const result = weldHeat({
        process: 'gtaw',
        voltage: 12,
        current: 100,
        travelSpeed: 100,
        baseMetal: 'stainlessSteel',
        thickness: 3,
      });

      expect(result.interpassTemp.max).toBeLessThanOrEqual(150);
    });

    it('should recommend higher interpass for cast iron', () => {
      const result = weldHeat({
        process: 'smaw',
        voltage: 22,
        current: 100,
        travelSpeed: 150,
        baseMetal: 'castIron',
        thickness: 15,
      });

      expect(result.interpassTemp.min).toBeGreaterThan(100);
    });
  });

  describe('HAZ hardness estimate', () => {
    it('should estimate maximum HAZ hardness', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 300,
        baseMetal: 'lowAlloySteel',
        thickness: 15,
      });

      expect(result.hazHardnessMax).toBeGreaterThan(0);
      expect(result.hazHardnessMax).toBeLessThanOrEqual(600);
    });
  });

  describe('recommendations', () => {
    it('should provide recommendations for high CE materials', () => {
      const result = weldHeat({
        process: 'smaw',
        voltage: 24,
        current: 120,
        travelSpeed: 200,
        baseMetal: 'lowAlloySteel',
        thickness: 25,
      });

      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should recommend for stainless steel', () => {
      const result = weldHeat({
        process: 'gtaw',
        voltage: 12,
        current: 100,
        travelSpeed: 100,
        baseMetal: 'stainlessSteel',
        thickness: 3,
      });

      expect(result.recommendations.some(r => r.includes('sensitization'))).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle zero current', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 0,
        travelSpeed: 300,
        baseMetal: 'mildSteel',
        thickness: 10,
      });

      expect(result.heatInput).toBe(0);
    });

    it('should handle zero travel speed', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 0,
        baseMetal: 'mildSteel',
        thickness: 10,
      });

      expect(result.heatInput).toBe(0);
    });
  });
});
