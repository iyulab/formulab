import { describe, it, expect } from 'vitest';
import { ledResistor } from './led.js';

describe('ledResistor', () => {
  describe('basic resistance calculation', () => {
    it('should calculate resistance for typical red LED', () => {
      // 5V supply, 2V forward voltage, 20mA current
      // R = (5 - 2) / 0.02 = 150 Ω
      const result = ledResistor({
        supplyVoltage: 5,
        forwardVoltage: 2,
        forwardCurrent: 20,
      });

      expect(result.resistance).toBe(150);
    });

    it('should calculate resistance for typical white LED', () => {
      // 12V supply, 3.2V forward voltage, 20mA current
      // R = (12 - 3.2) / 0.02 = 440 Ω
      const result = ledResistor({
        supplyVoltage: 12,
        forwardVoltage: 3.2,
        forwardCurrent: 20,
      });

      expect(result.resistance).toBe(440);
    });

    it('should calculate resistance for high-power LED', () => {
      // 24V supply, 3.5V forward voltage, 350mA current
      // R = (24 - 3.5) / 0.35 = 58.57 Ω
      const result = ledResistor({
        supplyVoltage: 24,
        forwardVoltage: 3.5,
        forwardCurrent: 350,
      });

      expect(result.resistance).toBeCloseTo(58.57, 1);
    });
  });

  describe('standard resistor selection', () => {
    it('should find nearest E24 standard resistor', () => {
      const result = ledResistor({
        supplyVoltage: 5,
        forwardVoltage: 2,
        forwardCurrent: 20,
      });

      // 150 Ω is a standard E24 value
      expect(result.standardResistance).toBe(150);
    });

    it('should round to nearest standard for non-standard values', () => {
      // R = (5 - 1.8) / 0.015 = 213.33 Ω → 220 Ω (E24)
      const result = ledResistor({
        supplyVoltage: 5,
        forwardVoltage: 1.8,
        forwardCurrent: 15,
      });

      expect(result.standardResistance).toBe(220);
    });
  });

  describe('power dissipation', () => {
    it('should calculate power dissipation correctly', () => {
      const result = ledResistor({
        supplyVoltage: 5,
        forwardVoltage: 2,
        forwardCurrent: 20,
      });

      // P = I² × R = 0.02² × 150 = 0.06 W = 60 mW
      expect(result.powerDissipation).toBe(60);
    });

    it('should calculate high power correctly', () => {
      const result = ledResistor({
        supplyVoltage: 12,
        forwardVoltage: 2,
        forwardCurrent: 100,
      });

      // R = 100 Ω, P = 0.1² × 100 = 1 W = 1000 mW
      expect(result.powerDissipation).toBe(1000);
    });
  });

  describe('actual current with standard resistor', () => {
    it('should calculate actual current when resistor matches', () => {
      const result = ledResistor({
        supplyVoltage: 5,
        forwardVoltage: 2,
        forwardCurrent: 20,
      });

      // Standard is 150 Ω, same as calculated
      expect(result.actualCurrent).toBe(20);
    });

    it('should calculate actual current when resistor differs', () => {
      // Calculated: 213.33 Ω, Standard: 220 Ω
      // Actual I = (5 - 1.8) / 220 = 14.55 mA
      const result = ledResistor({
        supplyVoltage: 5,
        forwardVoltage: 1.8,
        forwardCurrent: 15,
      });

      expect(result.actualCurrent).toBeCloseTo(14.55, 1);
    });
  });

  describe('input validation', () => {
    it('should throw error when supply voltage <= forward voltage', () => {
      expect(() =>
        ledResistor({
          supplyVoltage: 2,
          forwardVoltage: 3,
          forwardCurrent: 20,
        })
      ).toThrow('Supply voltage must be greater than forward voltage');
    });

    it('should throw error when supply equals forward voltage', () => {
      expect(() =>
        ledResistor({
          supplyVoltage: 3,
          forwardVoltage: 3,
          forwardCurrent: 20,
        })
      ).toThrow('Supply voltage must be greater than forward voltage');
    });

    it('should throw error for zero current', () => {
      expect(() =>
        ledResistor({
          supplyVoltage: 5,
          forwardVoltage: 2,
          forwardCurrent: 0,
        })
      ).toThrow('Forward current must be positive');
    });

    it('should throw error for negative current', () => {
      expect(() =>
        ledResistor({
          supplyVoltage: 5,
          forwardVoltage: 2,
          forwardCurrent: -10,
        })
      ).toThrow('Forward current must be positive');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle Arduino 3.3V LED circuit', () => {
      const result = ledResistor({
        supplyVoltage: 3.3,
        forwardVoltage: 2.0,
        forwardCurrent: 10,
      });

      // R = (3.3 - 2.0) / 0.01 = 130 Ω
      expect(result.resistance).toBe(130);
    });

    it('should handle automotive 12V LED circuit', () => {
      const result = ledResistor({
        supplyVoltage: 13.8, // Car alternator voltage
        forwardVoltage: 2.1,
        forwardCurrent: 20,
      });

      // R = (13.8 - 2.1) / 0.02 = 585 Ω
      expect(result.resistance).toBe(585);
    });
  });
});
