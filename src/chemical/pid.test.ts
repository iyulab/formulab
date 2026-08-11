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

  describe('Cohen-Coon (golden, Cohen & Coon 1953 table, K=1 L=1 T=10 → r=0.1)', () => {
    // Hand-computed from the published Cohen-Coon table, independently of this file's
    // implementation: P: Kp=(T/L)(1+r/3); PI: Kp=(T/L)(0.9+r/12), Ti=L(30+3r)/(9+20r);
    // PID: Kp=(T/L)(4/3+r/4), Ti=L(32+6r)/(13+8r), Td=4L/(11+2r). K=1 here so 1/K drops out.
    it('P: Kp = 10 x (1 + 0.1/3) = 10.3333', () => {
      const result = pid({
        method: 'cohen-coon',
        controllerType: 'P',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      expect(result.kp).toBeCloseTo(10.3333, 3);
      expect(result.ti).toBe(0); // Infinity -> serialized as 0
      expect(result.td).toBe(0);
    });

    it('PI: Kp = 10 x (0.9 + 0.1/12) = 9.0833, Ti = 30.3/11 = 2.7545', () => {
      const result = pid({
        method: 'cohen-coon',
        controllerType: 'PI',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      expect(result.kp).toBeCloseTo(9.0833, 3);
      expect(result.ti).toBeCloseTo(2.7545, 3);
      expect(result.ki).toBeCloseTo(3.29758, 4);
      expect(result.td).toBe(0);
    });

    it('PID: Kp = 10 x (4/3 + 0.1/4) = 13.5833, Ti = 32.6/13.8 = 2.3623, Td = 4/11.2 = 0.3571', () => {
      const result = pid({
        method: 'cohen-coon',
        controllerType: 'PID',
        processGain: 1, deadTime: 1, timeConstant: 10,
      });

      expect(result.kp).toBeCloseTo(13.5833, 3);
      expect(result.ti).toBeCloseTo(2.3623, 3);
      expect(result.td).toBeCloseTo(0.3571, 3);
      expect(result.ki).toBeCloseTo(5.75, 3);
      expect(result.kd).toBeCloseTo(4.8512, 3);
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
    it('should throw for zero process gain (Z-N step)', () => {
      expect(() => pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PID',
        processGain: 0, deadTime: 1, timeConstant: 10,
      })).toThrow();
    });

    it('should throw for zero dead time (Z-N step)', () => {
      expect(() => pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PID',
        processGain: 1, deadTime: 0, timeConstant: 10,
      })).toThrow();
    });

    it('should throw for zero time constant (Z-N step)', () => {
      expect(() => pid({
        method: 'ziegler-nichols-step',
        controllerType: 'PID',
        processGain: 1, deadTime: 1, timeConstant: 0,
      })).toThrow();
    });

    it('should throw for non-positive ultimate gain (Z-N ultimate)', () => {
      expect(() => pid({
        method: 'ziegler-nichols-ultimate',
        controllerType: 'PID',
        ultimateGain: 0, ultimatePeriod: 4,
      })).toThrow();
    });

    it('should throw for non-positive ultimate period (Z-N ultimate)', () => {
      expect(() => pid({
        method: 'ziegler-nichols-ultimate',
        controllerType: 'PID',
        ultimateGain: 5, ultimatePeriod: 0,
      })).toThrow();
    });

    it('should throw for zero process gain (Cohen-Coon)', () => {
      expect(() => pid({
        method: 'cohen-coon',
        controllerType: 'PID',
        processGain: 0, deadTime: 1, timeConstant: 10,
      })).toThrow();
    });
  });
});
