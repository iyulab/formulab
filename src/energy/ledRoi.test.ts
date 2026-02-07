import { describe, it, expect } from 'vitest';
import { ledRoi } from './ledRoi.js';

describe('ledRoi', () => {
  describe('energy calculation', () => {
    it('should calculate old and new annual energy correctly', () => {
      const result = ledRoi({
        fixtureCount: 100,
        oldWatts: 250,          // 250W MH
        newWatts: 100,          // 100W LED
        operatingHours: 4000,
        electricityRate: 0.12,
      });

      // oldEnergy = 100 × 250 × 4000 / 1000 = 100,000 kWh
      expect(result.oldAnnualEnergy).toBe(100000);

      // newEnergy = 100 × 100 × 4000 / 1000 = 40,000 kWh
      expect(result.newAnnualEnergy).toBe(40000);

      // saved = 60,000 kWh
      expect(result.annualEnergySaved).toBe(60000);
    });

    it('should calculate energy reduction percentage', () => {
      const result = ledRoi({
        fixtureCount: 50,
        oldWatts: 400,
        newWatts: 150,
        operatingHours: 3000,
        electricityRate: 0.10,
      });

      // reduction = (400 - 150) / 400 × 100 = 62.5%
      expect(result.energyReduction).toBe(62.5);
    });
  });

  describe('cost savings', () => {
    it('should calculate annual cost saved', () => {
      const result = ledRoi({
        fixtureCount: 100,
        oldWatts: 250,
        newWatts: 100,
        operatingHours: 4000,
        electricityRate: 0.12,
      });

      // costSaved = 60000 × 0.12 = $7,200
      expect(result.annualCostSaved).toBe(7200);
    });
  });

  describe('investment and payback', () => {
    it('should calculate total investment and payback', () => {
      const result = ledRoi({
        fixtureCount: 100,
        oldWatts: 250,
        newWatts: 100,
        operatingHours: 4000,
        electricityRate: 0.12,
        fixtureCost: 150,
        installationCost: 5000,
      });

      // totalInvestment = 150 × 100 + 5000 = $20,000
      expect(result.totalInvestment).toBe(20000);

      // payback = 20000 / 7200 = 2.78 years
      expect(result.paybackPeriod).toBeCloseTo(2.78, 1);
    });

    it('should return null payback when no investment', () => {
      const result = ledRoi({
        fixtureCount: 100,
        oldWatts: 250,
        newWatts: 100,
        operatingHours: 4000,
        electricityRate: 0.12,
      });

      expect(result.totalInvestment).toBe(0);
      expect(result.paybackPeriod).toBeNull();
    });

    it('should handle installation cost only', () => {
      const result = ledRoi({
        fixtureCount: 100,
        oldWatts: 250,
        newWatts: 100,
        operatingHours: 4000,
        electricityRate: 0.12,
        installationCost: 3000,
      });

      expect(result.totalInvestment).toBe(3000);
      expect(result.paybackPeriod).toBeCloseTo(3000 / 7200, 2);
    });
  });

  describe('CO2 savings', () => {
    it('should calculate CO2 savings with default factor', () => {
      const result = ledRoi({
        fixtureCount: 100,
        oldWatts: 250,
        newWatts: 100,
        operatingHours: 4000,
        electricityRate: 0.12,
      });

      // co2Saved = 60000 × 0.5 = 30,000 kg
      expect(result.co2Saved).toBe(30000);
    });

    it('should calculate CO2 savings with custom factor', () => {
      const result = ledRoi({
        fixtureCount: 100,
        oldWatts: 250,
        newWatts: 100,
        operatingHours: 4000,
        electricityRate: 0.12,
        co2Factor: 0.7,
      });

      // co2Saved = 60000 × 0.7 = 42,000 kg
      expect(result.co2Saved).toBe(42000);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero fixture count', () => {
      const result = ledRoi({
        fixtureCount: 0,
        oldWatts: 250,
        newWatts: 100,
        operatingHours: 4000,
        electricityRate: 0.12,
      });

      expect(result.annualEnergySaved).toBe(0);
      expect(result.co2Saved).toBe(0);
    });

    it('should return zeros for zero operating hours', () => {
      const result = ledRoi({
        fixtureCount: 100,
        oldWatts: 250,
        newWatts: 100,
        operatingHours: 0,
        electricityRate: 0.12,
      });

      expect(result.annualEnergySaved).toBe(0);
    });

    it('should handle same wattage (no improvement)', () => {
      const result = ledRoi({
        fixtureCount: 100,
        oldWatts: 100,
        newWatts: 100,
        operatingHours: 4000,
        electricityRate: 0.12,
        fixtureCost: 50,
      });

      expect(result.annualEnergySaved).toBe(0);
      expect(result.paybackPeriod).toBeNull();
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate warehouse T8 to LED tube retrofit', () => {
      const result = ledRoi({
        fixtureCount: 200,
        oldWatts: 64,          // 2× T8 32W
        newWatts: 30,          // LED tube replacement
        operatingHours: 5000,
        electricityRate: 0.11,
        fixtureCost: 45,
        installationCost: 2000,
        co2Factor: 0.45,
      });

      expect(result.annualEnergySaved).toBeGreaterThan(0);
      expect(result.paybackPeriod).toBeLessThan(5);
      expect(result.co2Saved).toBeGreaterThan(0);
    });

    it('should calculate office HID to LED high-bay retrofit', () => {
      const result = ledRoi({
        fixtureCount: 50,
        oldWatts: 400,
        newWatts: 200,
        operatingHours: 4380,
        electricityRate: 0.14,
        fixtureCost: 300,
        installationCost: 5000,
      });

      expect(result.energyReduction).toBe(50);
      expect(result.paybackPeriod).toBeLessThan(4);
    });
  });
});
