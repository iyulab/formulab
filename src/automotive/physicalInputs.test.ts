import { describe, it, expect } from 'vitest';
import { batteryRuntime } from './batteryRuntime.js';
import { evCharging } from './evCharging.js';
import { gearRatio } from './gearRatio.js';
import { tireCompare } from './tireCompare.js';

// A negative physical quantity used to come back as a sign-flipped "result"; each is refused now.
describe('automotive physical-input domains', () => {
  describe('batteryRuntime', () => {
    it('refuses an efficiency outside (0, 1]', () => {
      expect(() => batteryRuntime({ capacityAh: 100, voltageV: 12, loadW: 100, efficiency: -0.9 })).toThrow(RangeError);
      expect(() => batteryRuntime({ capacityAh: 100, voltageV: 12, loadW: 100, efficiency: 0 })).toThrow(RangeError);
      expect(() => batteryRuntime({ capacityAh: 100, voltageV: 12, loadW: 100, efficiency: 1.2 })).toThrow(RangeError);
      expect(() => batteryRuntime({ capacityAh: 100, voltageV: 12, loadW: 100, efficiency: NaN })).toThrow(RangeError);
    });

    it('accepts efficiency = 1: 1200 Wh / 100 W = 12 h', () => {
      expect(batteryRuntime({ capacityAh: 100, voltageV: 12, loadW: 100, efficiency: 1 }).runtimeHours).toBe(12);
    });
  });

  describe('evCharging', () => {
    it('refuses a non-positive battery capacity', () => {
      expect(() => evCharging({ batteryCapacityKwh: -60, chargerPowerKw: 11, socStartPercent: 20, socEndPercent: 80, efficiency: 1 })).toThrow(RangeError);
      expect(() => evCharging({ batteryCapacityKwh: 0, chargerPowerKw: 11, socStartPercent: 20, socEndPercent: 80, efficiency: 1 })).toThrow(RangeError);
    });

    it('accepts a positive capacity: 60 kWh × 60% = 36 kWh', () => {
      expect(evCharging({ batteryCapacityKwh: 60, chargerPowerKw: 11, socStartPercent: 20, socEndPercent: 80, efficiency: 1 }).energyNeeded).toBe(36);
    });
  });

  describe('gearRatio', () => {
    it('refuses an efficiency outside (0, 1]', () => {
      expect(() => gearRatio({ drivingTeeth: 20, drivenTeeth: 40, inputSpeed: 1000, inputTorque: 10, efficiency: -0.95 })).toThrow(RangeError);
      expect(() => gearRatio({ drivingTeeth: 20, drivenTeeth: 40, inputSpeed: 1000, inputTorque: 10, efficiency: 1.1 })).toThrow(RangeError);
    });

    it('accepts efficiency = 1 and a signed speed as direction', () => {
      const result = gearRatio({ drivingTeeth: 20, drivenTeeth: 40, inputSpeed: -1000, inputTorque: 10, efficiency: 1 });
      expect(result.outputTorque).toBe(20);
      expect(result.outputSpeed).toBe(-500);
    });
  });

  describe('tireCompare', () => {
    it('refuses a non-positive width, aspect ratio or rim', () => {
      expect(() => tireCompare({ tire1: { width: -205, aspect: 55, rim: 16 }, tire2: { width: 205, aspect: 55, rim: 16 } })).toThrow(RangeError);
      expect(() => tireCompare({ tire1: { width: 205, aspect: 55, rim: 16 }, tire2: { width: 205, aspect: -55, rim: 16 } })).toThrow(RangeError);
      expect(() => tireCompare({ tire1: { width: 205, aspect: 55, rim: 0 }, tire2: { width: 205, aspect: 55, rim: 16 } })).toThrow(RangeError);
    });

    it('accepts a real size: 205/55R16 → 631.9 mm', () => {
      const result = tireCompare({ tire1: { width: 205, aspect: 55, rim: 16 }, tire2: { width: 205, aspect: 55, rim: 16 } });
      expect(result.tire1.diameter).toBe(631.9);
      expect(result.diameterDiffPercent).toBe(0);
    });
  });
});
