import { describe, it, expect } from 'vitest';
import { cycleLife } from './cycleLife.js';

describe('cycleLife', () => {
  describe('base cycle values', () => {
    it('LFP at 80% DOD, 25°C → ~3500 cycles', () => {
      const result = cycleLife({ chemistry: 'LFP', depthOfDischarge: 80, temperatureC: 25 });
      expect(result.baseCycles).toBe(3500);
      expect(result.dodFactor).toBeCloseTo(1.0, 2);
      expect(result.temperatureFactor).toBe(1.0);
      expect(result.estimatedCycles).toBeCloseTo(3500, 0);
    });

    it('NMC at 80% DOD, 25°C → ~1500 cycles', () => {
      const result = cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 25 });
      expect(result.estimatedCycles).toBeCloseTo(1500, 0);
    });

    it('LTO at 80% DOD, 25°C → ~15000 cycles', () => {
      const result = cycleLife({ chemistry: 'LTO', depthOfDischarge: 80, temperatureC: 25 });
      expect(result.estimatedCycles).toBeCloseTo(15000, 0);
    });
  });

  describe('DOD factor', () => {
    it('50% DOD → factor 1.5', () => {
      const result = cycleLife({ chemistry: 'LFP', depthOfDischarge: 50, temperatureC: 25 });
      expect(result.dodFactor).toBeCloseTo(1.5, 2);
      expect(result.estimatedCycles).toBeCloseTo(5250, 0);
    });

    it('30% DOD → factor 1.5', () => {
      const result = cycleLife({ chemistry: 'LFP', depthOfDischarge: 30, temperatureC: 25 });
      expect(result.dodFactor).toBeCloseTo(1.5, 2);
    });

    it('65% DOD → linear interpolation between 1.5 and 1.0', () => {
      // At 65%, factor = 1.5 - ((65-50)/30)*0.5 = 1.5 - 0.25 = 1.25
      const result = cycleLife({ chemistry: 'NMC', depthOfDischarge: 65, temperatureC: 25 });
      expect(result.dodFactor).toBeCloseTo(1.25, 2);
      expect(result.estimatedCycles).toBeCloseTo(1875, 0);
    });

    it('100% DOD → factor 0.7', () => {
      const result = cycleLife({ chemistry: 'LFP', depthOfDischarge: 100, temperatureC: 25 });
      expect(result.dodFactor).toBeCloseTo(0.7, 2);
      expect(result.estimatedCycles).toBeCloseTo(2450, 0);
    });

    it('90% DOD → interpolated between 1.0 and 0.7', () => {
      // At 90%, factor = 1.0 - ((90-80)/20)*0.3 = 1.0 - 0.15 = 0.85
      const result = cycleLife({ chemistry: 'LFP', depthOfDischarge: 90, temperatureC: 25 });
      expect(result.dodFactor).toBeCloseTo(0.85, 2);
    });
  });

  describe('temperature factor', () => {
    it('sub-zero → factor 0.5', () => {
      const result = cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: -10 });
      expect(result.temperatureFactor).toBe(0.5);
      expect(result.estimatedCycles).toBeCloseTo(750, 0);
    });

    it('cold (5°C) → factor 0.8', () => {
      const result = cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 5 });
      expect(result.temperatureFactor).toBe(0.8);
      expect(result.estimatedCycles).toBeCloseTo(1200, 0);
    });

    it('optimal (25°C) → factor 1.0', () => {
      const result = cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 25 });
      expect(result.temperatureFactor).toBe(1.0);
    });

    it('warm (40°C) → factor 0.8', () => {
      const result = cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 40 });
      expect(result.temperatureFactor).toBe(0.8);
    });

    it('hot (50°C) → factor 0.5', () => {
      const result = cycleLife({ chemistry: 'NMC', depthOfDischarge: 80, temperatureC: 50 });
      expect(result.temperatureFactor).toBe(0.5);
    });
  });

  describe('combined factors', () => {
    it('LFP, shallow DOD, optimal temp → maximum life', () => {
      const result = cycleLife({ chemistry: 'LFP', depthOfDischarge: 40, temperatureC: 25 });
      // 3500 × 1.5 × 1.0 = 5250
      expect(result.estimatedCycles).toBeCloseTo(5250, 0);
    });

    it('LCO, deep DOD, high temp → minimum life', () => {
      const result = cycleLife({ chemistry: 'LCO', depthOfDischarge: 100, temperatureC: 50 });
      // 800 × 0.7 × 0.5 = 280
      expect(result.estimatedCycles).toBeCloseTo(280, 0);
    });

    it('LeadAcid at 50% DOD, cold → 500 × 1.5 × 0.8 = 600', () => {
      const result = cycleLife({ chemistry: 'LeadAcid', depthOfDischarge: 50, temperatureC: 10 });
      expect(result.estimatedCycles).toBeCloseTo(600, 0);
    });
  });
});
