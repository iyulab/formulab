import { describe, it, expect } from 'vitest';
import { evCharging } from './evCharging.js';

describe('evCharging', () => {
  describe('energy calculation', () => {
    it('should calculate energy needed correctly', () => {
      const result = evCharging({
        batteryCapacityKwh: 60,
        chargerPowerKw: 11,
        socStartPercent: 20,
        socEndPercent: 80,
        efficiency: 1,
      });

      // Energy = 60 × (80-20)/100 = 36 kWh
      expect(result.energyNeeded).toBe(36);
    });

    it('should calculate energy from grid with efficiency', () => {
      const result = evCharging({
        batteryCapacityKwh: 60,
        chargerPowerKw: 11,
        socStartPercent: 20,
        socEndPercent: 80,
        efficiency: 0.9,
      });

      // Energy from grid = 36 / 0.9 = 40 kWh
      expect(result.energyFromGrid).toBe(40);
    });
  });

  describe('charging time calculation', () => {
    it('should calculate charging time in hours', () => {
      const result = evCharging({
        batteryCapacityKwh: 60,
        chargerPowerKw: 11,
        socStartPercent: 20,
        socEndPercent: 80,
        efficiency: 1,
      });

      // Time = 36 / 11 = 3.27 hours
      expect(result.chargingTimeHours).toBeCloseTo(3.27, 1);
    });

    it('should calculate charging time in minutes', () => {
      const result = evCharging({
        batteryCapacityKwh: 60,
        chargerPowerKw: 50,  // DC fast charger
        socStartPercent: 20,
        socEndPercent: 80,
        efficiency: 0.95,
      });

      // Energy = 36 / 0.95 = 37.89, Time = 37.89 / 50 = 0.76 hours = 45.5 min
      expect(result.chargingTimeMinutes).toBeCloseTo(45.47, 0);
    });
  });

  describe('edge cases', () => {
    it('should return zero when SOC end equals SOC start', () => {
      const result = evCharging({
        batteryCapacityKwh: 60,
        chargerPowerKw: 11,
        socStartPercent: 50,
        socEndPercent: 50,
        efficiency: 0.9,
      });

      expect(result.energyNeeded).toBe(0);
      expect(result.chargingTimeHours).toBe(0);
    });

    it('should return zero when SOC end less than SOC start', () => {
      const result = evCharging({
        batteryCapacityKwh: 60,
        chargerPowerKw: 11,
        socStartPercent: 80,
        socEndPercent: 20,
        efficiency: 0.9,
      });

      expect(result.energyNeeded).toBe(0);
      expect(result.chargingTimeHours).toBe(0);
    });

    it('should handle zero charger power', () => {
      const result = evCharging({
        batteryCapacityKwh: 60,
        chargerPowerKw: 0,
        socStartPercent: 20,
        socEndPercent: 80,
        efficiency: 0.9,
      });

      expect(result.energyNeeded).toBe(36);
      expect(result.chargingTimeHours).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate home Level 2 charging overnight', () => {
      const result = evCharging({
        batteryCapacityKwh: 75,
        chargerPowerKw: 7.4,
        socStartPercent: 10,
        socEndPercent: 100,
        efficiency: 0.92,
      });

      // Energy = 75 × 0.9 = 67.5, Grid = 73.37, Time = 9.9 hours
      expect(result.energyNeeded).toBe(67.5);
      expect(result.chargingTimeHours).toBeCloseTo(9.92, 1);
    });

    it('should calculate DC fast charging session', () => {
      const result = evCharging({
        batteryCapacityKwh: 100,
        chargerPowerKw: 150,
        socStartPercent: 10,
        socEndPercent: 80,
        efficiency: 0.95,
      });

      // Energy = 70, Grid = 73.68, Time = 0.49 hours = 29.5 min
      expect(result.energyNeeded).toBe(70);
      expect(result.chargingTimeMinutes).toBeCloseTo(29.47, 0);
    });

    it('should calculate Tesla Supercharger V3 session', () => {
      const result = evCharging({
        batteryCapacityKwh: 82,
        chargerPowerKw: 250,
        socStartPercent: 5,
        socEndPercent: 60,
        efficiency: 0.94,
      });

      // 55% of 82 = 45.1 kWh needed
      expect(result.energyNeeded).toBe(45.1);
      // At 250kW = ~11.5 min
      expect(result.chargingTimeMinutes).toBeLessThan(15);
    });

    it('should calculate workplace Level 2 top-up', () => {
      const result = evCharging({
        batteryCapacityKwh: 40,
        chargerPowerKw: 11,
        socStartPercent: 50,
        socEndPercent: 80,
        efficiency: 0.9,
      });

      // 30% of 40 = 12 kWh, Time = 12/0.9/11 = 1.21 hours
      expect(result.energyNeeded).toBe(12);
      expect(result.chargingTimeHours).toBeCloseTo(1.21, 1);
    });
  });
});
