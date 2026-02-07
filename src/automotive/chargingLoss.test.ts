import { describe, it, expect } from 'vitest';
import { chargingLoss } from './chargingLoss.js';

describe('chargingLoss', () => {
  describe('AC Level 2 charging', () => {
    it('should calculate basic charging metrics', () => {
      const result = chargingLoss({
        batteryCapacity: 75,  // kWh
        chargerPower: 11,     // kW
        chargerType: 'ac_l2',
        soc: 20,
        targetSoc: 100,
      });

      // Energy delivered = 75 × (100-20)/100 = 60 kWh
      expect(result.energyDelivered).toBe(60);
      expect(result.energyConsumed).toBeGreaterThan(60);
      expect(result.totalLoss).toBeGreaterThan(0);
      expect(result.overallEfficiency).toBeGreaterThan(0);
      expect(result.chargingTime).toBeGreaterThan(0);
    });

    it('should default to 100% target SOC for AC', () => {
      const result = chargingLoss({
        batteryCapacity: 75, chargerPower: 11, chargerType: 'ac_l2',
        soc: 50,
      });

      expect(result.energyDelivered).toBeCloseTo(37.5, 1);
    });
  });

  describe('DC fast charging', () => {
    it('should default to 80% target SOC for DC', () => {
      const result = chargingLoss({
        batteryCapacity: 75, chargerPower: 150, chargerType: 'dc_fast',
        soc: 20,
      });

      expect(result.energyDelivered).toBeCloseTo(45, 1);
    });

    it('should have higher charger efficiency than AC L1', () => {
      const dc = chargingLoss({
        batteryCapacity: 75, chargerPower: 150, chargerType: 'dc_fast',
        soc: 20, targetSoc: 80,
      });
      const ac = chargingLoss({
        batteryCapacity: 75, chargerPower: 1.4, chargerType: 'ac_l1',
        soc: 20, targetSoc: 80,
      });

      expect(dc.overallEfficiency).toBeGreaterThan(ac.overallEfficiency);
    });
  });

  describe('loss breakdown', () => {
    it('should have chargerLoss + batteryLoss ≈ totalLoss', () => {
      const result = chargingLoss({
        batteryCapacity: 75, chargerPower: 11, chargerType: 'ac_l2',
        soc: 20, targetSoc: 100,
      });

      expect(result.chargerLoss + result.batteryLoss).toBeCloseTo(result.totalLoss, 1);
    });

    it('should have energyConsumed = energyDelivered + totalLoss', () => {
      const result = chargingLoss({
        batteryCapacity: 75, chargerPower: 11, chargerType: 'ac_l2',
        soc: 20, targetSoc: 100,
      });

      expect(result.energyConsumed).toBeCloseTo(result.energyDelivered + result.totalLoss, 1);
    });
  });

  describe('temperature derating', () => {
    it('should derate power in cold weather', () => {
      const normal = chargingLoss({
        batteryCapacity: 75, chargerPower: 150, chargerType: 'dc_fast',
        soc: 20, targetSoc: 80,
      });
      const cold = chargingLoss({
        batteryCapacity: 75, chargerPower: 150, chargerType: 'dc_fast',
        soc: 20, targetSoc: 80, ambientTemp: -10,
      });

      expect(cold.effectivePower).toBeLessThan(normal.effectivePower);
      expect(cold.chargingTime).toBeGreaterThan(normal.chargingTime);
    });

    it('should not derate at moderate temperature', () => {
      const result = chargingLoss({
        batteryCapacity: 75, chargerPower: 150, chargerType: 'dc_fast',
        soc: 20, targetSoc: 80, ambientTemp: 25,
      });

      expect(result.effectivePower).toBe(150);
    });
  });

  describe('custom efficiencies', () => {
    it('should use custom charger efficiency', () => {
      const result = chargingLoss({
        batteryCapacity: 75, chargerPower: 11, chargerType: 'ac_l2',
        chargerEfficiency: 0.95, batteryEfficiency: 0.98,
        soc: 20, targetSoc: 100,
      });

      expect(result.overallEfficiency).toBeCloseTo(93.1, 0);
    });
  });

  describe('edge cases', () => {
    it('should handle soc = targetSoc (no charging needed)', () => {
      const result = chargingLoss({
        batteryCapacity: 75, chargerPower: 11, chargerType: 'ac_l2',
        soc: 80, targetSoc: 80,
      });

      expect(result.energyDelivered).toBe(0);
      expect(result.totalLoss).toBe(0);
      expect(result.chargingTime).toBe(0);
    });
  });
});
