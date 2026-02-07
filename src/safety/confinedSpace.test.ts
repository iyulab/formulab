import { describe, it, expect } from 'vitest';
import { confinedSpace } from './confinedSpace.js';

describe('confinedSpace', () => {
  describe('safe atmosphere', () => {
    it('should permit entry with safe conditions', () => {
      const result = confinedSpace({
        oxygenPercent: 20.9,
        lelPercent: 0,
        h2sPpm: 0,
        coPpm: 0,
      });

      expect(result.oxygenStatus).toBe('safe');
      expect(result.lelStatus).toBe('safe');
      expect(result.h2sStatus).toBe('safe');
      expect(result.coStatus).toBe('safe');
      expect(result.overallStatus).toBe('safe');
      expect(result.entryPermitted).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('oxygen assessment', () => {
    it('should detect oxygen deficiency', () => {
      const result = confinedSpace({ oxygenPercent: 18.0, lelPercent: 0 });
      expect(result.oxygenStatus).toBe('deficient');
      expect(result.overallStatus).toBe('danger');
      expect(result.entryPermitted).toBe(false);
    });

    it('should detect oxygen enrichment', () => {
      const result = confinedSpace({ oxygenPercent: 24.0, lelPercent: 0 });
      expect(result.oxygenStatus).toBe('enriched');
      expect(result.overallStatus).toBe('danger');
    });

    it('should accept normal oxygen (19.5-23.5%)', () => {
      const result = confinedSpace({ oxygenPercent: 20.9, lelPercent: 0 });
      expect(result.oxygenStatus).toBe('safe');
    });

    it('should accept boundary values', () => {
      const low = confinedSpace({ oxygenPercent: 19.5, lelPercent: 0 });
      expect(low.oxygenStatus).toBe('safe');

      const high = confinedSpace({ oxygenPercent: 23.5, lelPercent: 0 });
      expect(high.oxygenStatus).toBe('safe');
    });
  });

  describe('LEL assessment', () => {
    it('should classify safe LEL < 10%', () => {
      const result = confinedSpace({ oxygenPercent: 20.9, lelPercent: 5 });
      expect(result.lelStatus).toBe('safe');
    });

    it('should classify caution 10-25%', () => {
      const result = confinedSpace({ oxygenPercent: 20.9, lelPercent: 15 });
      expect(result.lelStatus).toBe('caution');
    });

    it('should classify danger > 25%', () => {
      const result = confinedSpace({ oxygenPercent: 20.9, lelPercent: 30 });
      expect(result.lelStatus).toBe('danger');
    });
  });

  describe('H₂S assessment', () => {
    it('should detect IDLH > 100 ppm', () => {
      const result = confinedSpace({ oxygenPercent: 20.9, lelPercent: 0, h2sPpm: 150 });
      expect(result.h2sStatus).toBe('idlh');
      expect(result.overallStatus).toBe('idlh');
    });

    it('should return null when h2sPpm not provided', () => {
      const result = confinedSpace({ oxygenPercent: 20.9, lelPercent: 0 });
      expect(result.h2sStatus).toBeNull();
    });
  });

  describe('CO assessment', () => {
    it('should detect IDLH > 1200 ppm', () => {
      const result = confinedSpace({ oxygenPercent: 20.9, lelPercent: 0, coPpm: 1500 });
      expect(result.coStatus).toBe('idlh');
    });

    it('should classify caution 25-50 ppm', () => {
      const result = confinedSpace({ oxygenPercent: 20.9, lelPercent: 0, coPpm: 30 });
      expect(result.coStatus).toBe('caution');
    });
  });

  describe('custom gas', () => {
    it('should assess custom gas against PEL and IDLH', () => {
      const result = confinedSpace({
        oxygenPercent: 20.9,
        lelPercent: 0,
        customGas: { name: 'NH3', concentration: 50, pel: 25, idlh: 300 },
      });

      expect(result.customGasStatus).toBe('exceeds_pel');
    });

    it('should detect IDLH for custom gas', () => {
      const result = confinedSpace({
        oxygenPercent: 20.9,
        lelPercent: 0,
        customGas: { name: 'NH3', concentration: 350, pel: 25, idlh: 300 },
      });

      expect(result.customGasStatus).toBe('idlh');
      expect(result.overallStatus).toBe('idlh');
    });
  });

  describe('overall status', () => {
    it('should take worst case of all gases', () => {
      const result = confinedSpace({
        oxygenPercent: 20.9, // safe
        lelPercent: 5,       // safe
        h2sPpm: 15,          // caution
        coPpm: 0,            // safe
      });

      expect(result.overallStatus).toBe('caution');
      expect(result.entryPermitted).toBe(false);
    });
  });
});
