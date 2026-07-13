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

  describe('i18n codes (additive)', () => {
    it('should expose a stable preheat sourceCode alongside the source string', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 300,
        baseMetal: 'mildSteel',
        thickness: 10,
      });

      expect(['awsTable', 'awsJudgment', 'engineeringJudgment']).toContain(result.preheatTemp.sourceCode);
      // Backward-compatible: human-readable source string still present
      expect(typeof result.preheatTemp.source).toBe('string');
    });

    it('should map preheat source to engineeringJudgment for extremely high CE', () => {
      const result = weldHeat({
        process: 'smaw',
        voltage: 22,
        current: 100,
        travelSpeed: 150,
        baseMetal: 'castIron', // C=3.5 → very high CE
        thickness: 15,
      });

      expect(result.preheatTemp.sourceCode).toBe('engineeringJudgment');
      expect(result.preheatTemp.source).toBe('Engineering judgment - consult welding engineer');
    });

    it('should provide recommendationCodes parallel to recommendations', () => {
      const result = weldHeat({
        process: 'gtaw',
        voltage: 12,
        current: 100,
        travelSpeed: 100,
        baseMetal: 'stainlessSteel',
        thickness: 3,
      });

      // Same count, index-aligned with the English strings
      expect(result.recommendationCodes).toHaveLength(result.recommendations.length);
      expect(result.recommendationCodes.some(r => r.code === 'stainlessInterpass')).toBe(true);
      for (const rec of result.recommendationCodes) {
        expect(typeof rec.code).toBe('string');
        expect(rec.params).toBeTypeOf('object');
      }
    });

    it('should carry interpolation params in recommendation codes', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 28,
        current: 250,
        travelSpeed: 300,
        baseMetal: 'lowAlloySteel',
        thickness: 30,
      });

      const preheat = result.recommendationCodes.find(r => r.code === 'preheat');
      expect(preheat).toBeDefined();
      expect(preheat!.params.min).toBe(result.preheatTemp.min);
      expect(preheat!.params.max).toBe(result.preheatTemp.max);
      expect(preheat!.params.source).toBe(result.preheatTemp.sourceCode);
    });
  });

  describe('clamp disclosure (ISSUE-20260713 silent clamp)', () => {
    // Regression pins from the issue's execution evidence.
    it('flags the 700 HV ceiling for stainless (GMAW 6 mm, 26V/220A/350 mm/min → raw ≈ 1153 HV)', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 26,
        current: 220,
        travelSpeed: 350,
        baseMetal: 'stainlessSteel',
        thickness: 6,
      });

      expect(result.hazHardnessMax).toBe(700);
      expect(result.hazHardnessClamped).toBe(true);
      // The capped value must not be presented as the expected hardness
      expect(result.recommendations.some(r => r.includes('exceeds model ceiling'))).toBe(true);
      expect(result.recommendationCodes.some(r => r.code === 'hazHardnessCapped' && r.params.cap === 700)).toBe(true);
      expect(result.recommendationCodes.some(r => r.code === 'highHazHardness')).toBe(false);
      expect(result.recommendationCodes).toHaveLength(result.recommendations.length);
    });

    it('flags the ceiling for cast iron (raw HV ≈ 4200 — genuine white-iron HAZ exceeds 700)', () => {
      const result = weldHeat({
        process: 'smaw',
        voltage: 24,
        current: 120,
        travelSpeed: 200,
        baseMetal: 'castIron',
        thickness: 10,
      });

      expect(result.hazHardnessMax).toBe(700);
      expect(result.hazHardnessClamped).toBe(true);
    });

    it('does not flag hardness inside the model range and keeps highHazHardness wording', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 300,
        baseMetal: 'lowAlloySteel',
        thickness: 15,
      });

      expect(result.hazHardnessMax).toBeLessThan(700);
      expect(result.hazHardnessClamped).toBe(false);
      expect(result.recommendationCodes.some(r => r.code === 'hazHardnessCapped')).toBe(false);
    });

    it('flags the t8/5 floor for thin-sheet GTAW (12V/70A/400 mm/min → raw ≈ 0.39 s)', () => {
      const result = weldHeat({
        process: 'gtaw',
        voltage: 12,
        current: 70,
        travelSpeed: 400,
        baseMetal: 'mildSteel',
        thickness: 1,
      });

      expect(result.coolingTime_t85).toBe(0.5);
      expect(result.coolingTimeClamped).toBe(true);
    });

    it('reports why thin-sheet thickness sweeps look unresponsive (all floored to 0.5 s)', () => {
      const thin = weldHeat({ process: 'gtaw', voltage: 12, current: 70, travelSpeed: 400, baseMetal: 'mildSteel', thickness: 0.8 });
      const thick = weldHeat({ process: 'gtaw', voltage: 12, current: 70, travelSpeed: 400, baseMetal: 'mildSteel', thickness: 3 });

      // Identical floored outputs — but both disclose the clamp instead of looking broken
      expect(thin.coolingTime_t85).toBe(0.5);
      expect(thick.coolingTime_t85).toBe(0.5);
      expect(thin.coolingTimeClamped).toBe(true);
      expect(thick.coolingTimeClamped).toBe(true);
    });

    it('does not flag cooling time inside the model range', () => {
      const result = weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 300,
        baseMetal: 'mildSteel',
        thickness: 10,
      });

      expect(result.coolingTime_t85).toBeGreaterThan(0.5);
      expect(result.coolingTime_t85).toBeLessThan(300);
      expect(result.coolingTimeClamped).toBe(false);
    });

    it('mild steel current sweep stays unclamped and responsive (contrast to stainless flatline)', () => {
      const low = weldHeat({ process: 'gmaw', voltage: 26, current: 120, travelSpeed: 350, baseMetal: 'mildSteel', thickness: 6 });
      const high = weldHeat({ process: 'gmaw', voltage: 26, current: 300, travelSpeed: 350, baseMetal: 'mildSteel', thickness: 6 });

      expect(low.hazHardnessClamped).toBe(false);
      expect(high.hazHardnessClamped).toBe(false);
      expect(low.hazHardnessMax).not.toBe(high.hazHardnessMax);
    });
  });

  describe('edge cases', () => {
    it('should throw for zero current', () => {
      expect(() => weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 0,
        travelSpeed: 300,
        baseMetal: 'mildSteel',
        thickness: 10,
      })).toThrow(RangeError);
    });

    it('should throw for zero travel speed', () => {
      expect(() => weldHeat({
        process: 'gmaw',
        voltage: 25,
        current: 200,
        travelSpeed: 0,
        baseMetal: 'mildSteel',
        thickness: 10,
      })).toThrow(RangeError);
    });
  });
});
