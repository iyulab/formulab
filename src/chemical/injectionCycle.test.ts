import { describe, it, expect } from 'vitest';
import { injectionCycle } from './injectionCycle.js';

describe('injectionCycle', () => {
  describe('cooling time calculation', () => {
    it('should calculate cooling time for ABS', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 3, // 3mm
        shotWeight: 50, // 50g
      });

      expect(result.coolingTime).toBeGreaterThan(0);
      // The formula produces shorter times than typical industry estimates
      expect(result.coolingTime).toBeLessThan(30);
    });

    it('should increase cooling time with wall thickness', () => {
      const thin = injectionCycle({
        resin: 'abs',
        wallThickness: 2,
        shotWeight: 30,
      });

      const thick = injectionCycle({
        resin: 'abs',
        wallThickness: 4,
        shotWeight: 60,
      });

      expect(thick.coolingTime).toBeGreaterThan(thin.coolingTime);
    });
  });

  describe('resin types', () => {
    it('should calculate for PP (polypropylene)', () => {
      const result = injectionCycle({
        resin: 'pp',
        wallThickness: 2.5,
        shotWeight: 40,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
      expect(result.totalCycleTime).toBeGreaterThan(0);
    });

    it('should calculate for PC (polycarbonate)', () => {
      const result = injectionCycle({
        resin: 'pc',
        wallThickness: 2.5,
        shotWeight: 50,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
      // PC has higher thermal diffusivity, should cool faster
    });

    it('should calculate for PA (nylon)', () => {
      const result = injectionCycle({
        resin: 'pa',
        wallThickness: 2,
        shotWeight: 30,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
    });

    it('should calculate for PMMA (acrylic)', () => {
      const result = injectionCycle({
        resin: 'pmma',
        wallThickness: 3,
        shotWeight: 40,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
    });

    it('should calculate for PET', () => {
      const result = injectionCycle({
        resin: 'pet',
        wallThickness: 2,
        shotWeight: 25,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
    });

    it('should calculate for POM (acetal)', () => {
      const result = injectionCycle({
        resin: 'pom',
        wallThickness: 2.5,
        shotWeight: 35,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
    });

    it('should calculate for PS (polystyrene)', () => {
      const result = injectionCycle({
        resin: 'ps',
        wallThickness: 1.5,
        shotWeight: 20,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
    });
  });

  describe('fill time calculation', () => {
    it('should calculate fill time based on shot weight and injection rate', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 2,
        shotWeight: 80, // 80g
        injectionRate: 80, // 80 cm³/s
      });

      // Volume = 80g / 1.02 g/cm³ = 78.4 cm³
      // Fill time = 78.4 / 80 = 0.98 seconds
      expect(result.fillTime).toBeCloseTo(0.98, 1);
    });

    it('should use default injection rate when not specified', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 2,
        shotWeight: 50,
      });

      expect(result.fillTime).toBeGreaterThan(0);
    });
  });

  describe('packing time calculation', () => {
    it('should calculate packing time as 40% of cooling time', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 3,
        shotWeight: 50,
      });

      expect(result.packingTime).toBeCloseTo(result.coolingTime * 0.4, 1);
    });
  });

  describe('total cycle time', () => {
    it('should sum all phases correctly', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 3,
        shotWeight: 50,
        moldOpenCloseTime: 4,
        ejectionTime: 1,
      });

      const expectedTotal =
        result.coolingTime +
        result.fillTime +
        result.packingTime +
        result.moldOpenClose +
        result.ejectionTime;

      expect(result.totalCycleTime).toBeCloseTo(expectedTotal, 1);
    });

    it('should use default mold open/close and ejection times', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 2,
        shotWeight: 30,
      });

      expect(result.moldOpenClose).toBe(3); // default
      expect(result.ejectionTime).toBe(0.5); // default
    });
  });

  describe('parts per hour calculation', () => {
    it('should calculate parts per hour correctly', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 2,
        shotWeight: 30,
      });

      // parts/hour = 3600 / totalCycleTime
      const expectedParts = Math.floor(3600 / result.totalCycleTime);
      expect(result.partsPerHour).toBe(expectedParts);
    });
  });

  describe('breakdown percentages', () => {
    it('should provide breakdown with correct percentages', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 3,
        shotWeight: 50,
      });

      expect(result.breakdown.length).toBe(5);

      const totalPercentage = result.breakdown.reduce((sum, phase) => sum + phase.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 0);
    });

    it('should label phases correctly', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 2,
        shotWeight: 30,
      });

      const phases = result.breakdown.map(b => b.phase);
      expect(phases).toContain('Fill');
      expect(phases).toContain('Packing');
      expect(phases).toContain('Cooling');
      expect(phases).toContain('Mold Open/Close');
      expect(phases).toContain('Ejection');
    });
  });

  describe('custom resin', () => {
    it('should use custom thermal properties', () => {
      const result = injectionCycle({
        resin: 'custom',
        wallThickness: 2,
        shotWeight: 30,
        thermalDiffusivity: 0.15,
        meltTemp: 250,
        moldTemp: 50,
        ejectionTemp: 90,
        density: 1.1,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
      expect(result.totalCycleTime).toBeGreaterThan(0);
    });

    it('should use defaults when custom properties not provided', () => {
      const result = injectionCycle({
        resin: 'custom',
        wallThickness: 2,
        shotWeight: 30,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very thin wall (1mm)', () => {
      const result = injectionCycle({
        resin: 'pp',
        wallThickness: 1,
        shotWeight: 10,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
      expect(result.coolingTime).toBeLessThan(10);
    });

    it('should handle thick wall (6mm)', () => {
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 6,
        shotWeight: 100,
      });

      // Cooling time scales with wall thickness squared
      expect(result.coolingTime).toBeGreaterThan(5);
    });

    it('should handle invalid thermal conditions gracefully', () => {
      const result = injectionCycle({
        resin: 'custom',
        wallThickness: 2,
        shotWeight: 30,
        thermalDiffusivity: 0,
        meltTemp: 100,
        moldTemp: 100,
        ejectionTemp: 100,
      });

      expect(result.coolingTime).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should estimate automotive interior part cycle', () => {
      // Large ABS part: 4mm wall, 200g
      const result = injectionCycle({
        resin: 'abs',
        wallThickness: 4,
        shotWeight: 200,
        injectionRate: 100,
        moldOpenCloseTime: 5,
        ejectionTime: 1.5,
      });

      expect(result.totalCycleTime).toBeGreaterThan(10);
      expect(result.partsPerHour).toBeLessThan(300);
    });

    it('should estimate thin-wall packaging cycle', () => {
      // PP container: 0.8mm wall, 15g
      const result = injectionCycle({
        resin: 'pp',
        wallThickness: 0.8,
        shotWeight: 15,
        injectionRate: 150,
        moldOpenCloseTime: 2,
        ejectionTime: 0.3,
      });

      expect(result.totalCycleTime).toBeLessThan(10);
      expect(result.partsPerHour).toBeGreaterThan(300);
    });

    it('should estimate precision optical part cycle', () => {
      // PMMA lens: 3mm wall, 25g
      const result = injectionCycle({
        resin: 'pmma',
        wallThickness: 3,
        shotWeight: 25,
        injectionRate: 30, // Slow injection for quality
        moldOpenCloseTime: 4,
        ejectionTime: 1,
      });

      expect(result.coolingTime).toBeGreaterThan(0);
    });
  });
});
