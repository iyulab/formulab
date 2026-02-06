import { describe, it, expect } from 'vitest';
import { ohmsLaw } from './ohmsLaw.js';

describe('ohmsLaw', () => {
  describe('solve for voltage (V = I × R)', () => {
    it('should calculate voltage from current and resistance', () => {
      const result = ohmsLaw({ solveFor: 'voltage', current: 2, resistance: 5 });
      expect(result.voltage).toBe(10);
      expect(result.current).toBe(2);
      expect(result.resistance).toBe(5);
      expect(result.power).toBe(20);
    });

    it('should handle small values', () => {
      const result = ohmsLaw({ solveFor: 'voltage', current: 0.001, resistance: 1000 });
      expect(result.voltage).toBe(1);
      expect(result.power).toBe(0.001);
    });
  });

  describe('solve for current (I = V / R)', () => {
    it('should calculate current from voltage and resistance', () => {
      const result = ohmsLaw({ solveFor: 'current', voltage: 12, resistance: 4 });
      expect(result.current).toBe(3);
      expect(result.voltage).toBe(12);
      expect(result.power).toBe(36);
    });

    it('should handle zero voltage', () => {
      const result = ohmsLaw({ solveFor: 'current', voltage: 0, resistance: 100 });
      expect(result.current).toBe(0);
      expect(result.power).toBe(0);
    });
  });

  describe('solve for resistance (R = V / I)', () => {
    it('should calculate resistance from voltage and current', () => {
      const result = ohmsLaw({ solveFor: 'resistance', voltage: 24, current: 6 });
      expect(result.resistance).toBe(4);
      expect(result.power).toBe(144);
    });
  });

  describe('solve for power (P = V × I)', () => {
    it('should calculate all quantities including power', () => {
      const result = ohmsLaw({ solveFor: 'power', voltage: 120, current: 10 });
      expect(result.power).toBe(1200);
      expect(result.resistance).toBe(12);
    });

    it('should handle typical LED circuit', () => {
      // 5V supply, 20mA LED
      const result = ohmsLaw({ solveFor: 'power', voltage: 5, current: 0.02 });
      expect(result.power).toBe(0.1);
      expect(result.resistance).toBe(250);
    });
  });

  describe('validation', () => {
    it('should throw on zero current for voltage solve', () => {
      expect(() => ohmsLaw({ solveFor: 'voltage', current: 0, resistance: 5 })).toThrow();
    });

    it('should throw on zero resistance for current solve', () => {
      expect(() => ohmsLaw({ solveFor: 'current', voltage: 10, resistance: 0 })).toThrow();
    });

    it('should throw on negative voltage', () => {
      expect(() => ohmsLaw({ solveFor: 'current', voltage: -5, resistance: 10 })).toThrow();
    });

    it('should throw on negative resistance', () => {
      expect(() => ohmsLaw({ solveFor: 'voltage', current: 1, resistance: -5 })).toThrow();
    });
  });
});
