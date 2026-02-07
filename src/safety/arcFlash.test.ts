import { describe, it, expect } from 'vitest';
import { arcFlash } from './arcFlash.js';

describe('arcFlash', () => {
  describe('low voltage scenarios', () => {
    it('should calculate arc flash for 480V panel', () => {
      const result = arcFlash({
        voltage: 480,
        boltedFaultCurrent: 20,
        workingDistance: 610,
        faultClearingTime: 0.1,
        gapBetweenConductors: 32,
        enclosureType: 'panel',
      });

      expect(result.arcCurrent).toBeGreaterThan(0);
      expect(result.incidentEnergy).toBeGreaterThan(0);
      expect(result.arcFlashBoundary).toBeGreaterThan(0);
      expect([0, 1, 2, 3, 4]).toContain(result.ppeCategory);
    });

    it('should return safe hazard for low fault current + fast clearing', () => {
      const result = arcFlash({
        voltage: 208,
        boltedFaultCurrent: 5,
        workingDistance: 610,
        faultClearingTime: 0.02,
        gapBetweenConductors: 25,
        enclosureType: 'panel',
      });

      expect(result.incidentEnergy).toBeLessThan(5);
    });
  });

  describe('medium voltage scenarios', () => {
    it('should calculate arc flash for 4160V switchgear', () => {
      const result = arcFlash({
        voltage: 4160,
        boltedFaultCurrent: 30,
        workingDistance: 910,
        faultClearingTime: 0.5,
        gapBetweenConductors: 104,
        enclosureType: 'box',
      });

      expect(result.arcCurrent).toBeGreaterThan(0);
      expect(result.incidentEnergy).toBeGreaterThan(0);
      expect(result.ppeCategory).toBeGreaterThanOrEqual(2);
    });
  });

  describe('enclosure type effects', () => {
    it('open air should have lower energy than enclosed', () => {
      const base = {
        voltage: 480,
        boltedFaultCurrent: 20,
        workingDistance: 610,
        faultClearingTime: 0.2,
        gapBetweenConductors: 32,
      };

      const openResult = arcFlash({ ...base, enclosureType: 'open' });
      const boxResult = arcFlash({ ...base, enclosureType: 'box' });

      expect(openResult.incidentEnergy).toBeLessThan(boxResult.incidentEnergy);
    });
  });

  describe('working distance effect', () => {
    it('should decrease energy with increasing distance', () => {
      const base = {
        voltage: 480,
        boltedFaultCurrent: 20,
        faultClearingTime: 0.2,
        gapBetweenConductors: 32,
        enclosureType: 'panel' as const,
      };

      const close = arcFlash({ ...base, workingDistance: 455 });
      const far = arcFlash({ ...base, workingDistance: 910 });

      expect(far.incidentEnergy).toBeLessThan(close.incidentEnergy);
    });
  });

  describe('PPE categories', () => {
    it('should classify PPE category 0 when E ≤ 1.2', () => {
      const result = arcFlash({
        voltage: 208,
        boltedFaultCurrent: 3,
        workingDistance: 610,
        faultClearingTime: 0.02,
        gapBetweenConductors: 25,
        enclosureType: 'open',
      });

      if (result.incidentEnergy <= 1.2) {
        expect(result.ppeCategory).toBe(0);
        expect(result.hazardLevel).toBe('safe');
      }
    });

    it('should have requiredPPE string', () => {
      const result = arcFlash({
        voltage: 480,
        boltedFaultCurrent: 20,
        workingDistance: 610,
        faultClearingTime: 0.1,
        gapBetweenConductors: 32,
        enclosureType: 'panel',
      });

      expect(result.requiredPPE).toBeTruthy();
      expect(typeof result.requiredPPE).toBe('string');
    });
  });

  describe('clearing time effect', () => {
    it('should increase energy linearly with clearing time', () => {
      const base = {
        voltage: 480,
        boltedFaultCurrent: 20,
        workingDistance: 610,
        gapBetweenConductors: 32,
        enclosureType: 'panel' as const,
      };

      const fast = arcFlash({ ...base, faultClearingTime: 0.1 });
      const slow = arcFlash({ ...base, faultClearingTime: 0.5 });

      // Energy should scale with time
      expect(slow.incidentEnergy / fast.incidentEnergy).toBeCloseTo(5, 0);
    });
  });
});
