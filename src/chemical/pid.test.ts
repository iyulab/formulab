import { describe, it, expect } from 'vitest';
import { pid } from './pid.js';

describe('pid', () => {
  describe('Ziegler-Nichols Step Response', () => {
    it('should calculate PID gains correctly', () => {
      // K=1, L=1, T=10
      const result = pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PID',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      // Kp = 1.2 × T / (K × L) = 1.2 × 10 / 1 = 12
      expect(result.kp).toBeCloseTo(12, 2);
      // Ti = 2L = 2
      expect(result.ti).toBeCloseTo(2, 2);
      // Td = 0.5L = 0.5
      expect(result.td).toBeCloseTo(0.5, 2);
    });

    it('should calculate PI gains', () => {
      const result = pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PI',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      // Kp = 0.9 × 10 / 1 = 9
      expect(result.kp).toBeCloseTo(9, 2);
      // Td = 0 for PI
      expect(result.td).toBe(0);
      expect(result.kd).toBe(0);
    });

    it('should calculate P gain', () => {
      const result = pid({
        method: 'ziegler-nichols-step',
        controllerType: 'P',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      expect(result.kp).toBeCloseTo(10, 2);
      expect(result.ti).toBe(0); // Infinity → serialized as 0
      expect(result.td).toBe(0);
    });
  });

  describe('Ziegler-Nichols Ultimate', () => {
    it('should calculate PID from ultimate gain and period', () => {
      // Ku=5, Pu=4
      const result = pid({
        method: 'ziegler-nichols-ultimate',
        controllerType: 'PID',
        ultimateGain: 5, ultimatePeriod: 4,
      });

      // Kp = 0.6 × 5 = 3
      expect(result.kp).toBeCloseTo(3, 2);
      // Ti = 0.5 × 4 = 2
      expect(result.ti).toBeCloseTo(2, 2);
      // Td = 0.125 × 4 = 0.5
      expect(result.td).toBeCloseTo(0.5, 2);
    });

    it('should calculate PI from ultimate gain', () => {
      const result = pid({
        method: 'ziegler-nichols-ultimate',
        controllerType: 'PI',
        ultimateGain: 5, ultimatePeriod: 4,
      });

      // Kp = 0.45 × 5 = 2.25
      expect(result.kp).toBeCloseTo(2.25, 2);
      // Ti = 4 / 1.2 = 3.333
      expect(result.ti).toBeCloseTo(3.333, 2);
    });
  });

  describe('Cohen-Coon', () => {
    it('should calculate PID gains', () => {
      const result = pid({
        method: 'cohen-coon',
        controllerType: 'PID',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      expect(result.kp).toBeGreaterThan(0);
      expect(result.ti).toBeGreaterThan(0);
      expect(result.td).toBeGreaterThan(0);
    });

    it('should produce different gains than Z-N for same process', () => {
      const zn = pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PID',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });
      const cc = pid({
        method: 'cohen-coon',
        controllerType: 'PID',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      // They should differ
      expect(cc.kp).not.toBeCloseTo(zn.kp, 1);
    });
  });

  describe('Ki and Kd derived values', () => {
    it('should have Ki = Kp/Ti', () => {
      const result = pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PID',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      expect(result.ki).toBeCloseTo(result.kp / result.ti, 4);
    });

    it('should have Kd = Kp × Td', () => {
      const result = pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PID',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      expect(result.kd).toBeCloseTo(result.kp * result.td, 4);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero process gain', () => {
      const result = pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PID',
        processGain: 0, deadTime: 1, timeConstant: 10,
      });

      expect(result.kp).toBe(0);
    });

    it('should return zeros for zero dead time', () => {
      const result = pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PID',
        processGain: 1, deadTime: 0, timeConstant: 10,
      });

      expect(result.kp).toBe(0);
    });
  });
});
