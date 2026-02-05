import { describe, it, expect } from 'vitest';
import { gearRatio } from './gearRatio.js';

describe('gearRatio', () => {
  describe('basic gear ratio calculation', () => {
    it('should calculate gear ratio correctly', () => {
      const result = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 40,
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 1.0,
      });

      expect(result.gearRatio).toBe(2);
    });

    it('should calculate output speed correctly', () => {
      const result = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 40,
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 1.0,
      });

      // Output speed = 1000 / 2 = 500 RPM
      expect(result.outputSpeed).toBe(500);
    });

    it('should calculate output torque correctly with 100% efficiency', () => {
      const result = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 40,
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 1.0,
      });

      // Output torque = 10 * 2 * 1.0 = 20 Nm
      expect(result.outputTorque).toBe(20);
    });
  });

  describe('speed reduction vs speed increase', () => {
    it('should identify speed reduction (ratio > 1)', () => {
      const result = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 60, // Larger driven gear
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 1.0,
      });

      expect(result.gearRatio).toBe(3);
      expect(result.speedReduction).toBe(true);
      expect(result.outputSpeed).toBeCloseTo(333.33, 1);
    });

    it('should identify speed increase (ratio < 1)', () => {
      const result = gearRatio({
        drivingTeeth: 40,
        drivenTeeth: 20, // Smaller driven gear
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 1.0,
      });

      expect(result.gearRatio).toBe(0.5);
      expect(result.speedReduction).toBe(false);
      expect(result.outputSpeed).toBe(2000);
    });

    it('should handle 1:1 ratio', () => {
      const result = gearRatio({
        drivingTeeth: 30,
        drivenTeeth: 30,
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 1.0,
      });

      expect(result.gearRatio).toBe(1);
      expect(result.speedReduction).toBe(false);
      expect(result.outputSpeed).toBe(1000);
      expect(result.outputTorque).toBe(10);
    });
  });

  describe('efficiency considerations', () => {
    it('should reduce output torque with less than 100% efficiency', () => {
      const result = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 40,
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 0.9, // 90% efficiency
      });

      // Output torque = 10 * 2 * 0.9 = 18 Nm
      expect(result.outputTorque).toBe(18);
    });

    it('should not affect gear ratio or speed by efficiency', () => {
      const result100 = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 40,
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 1.0,
      });

      const result90 = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 40,
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 0.9,
      });

      expect(result90.gearRatio).toBe(result100.gearRatio);
      expect(result90.outputSpeed).toBe(result100.outputSpeed);
    });

    it('should calculate mechanical advantage correctly', () => {
      const result = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 40,
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 0.95,
      });

      // Output torque = 10 * 2 * 0.95 = 19
      // Mechanical advantage = 19 / 10 = 1.9
      expect(result.mechanicalAdvantage).toBe(1.9);
    });
  });

  describe('edge cases', () => {
    it('should handle zero driving teeth', () => {
      const result = gearRatio({
        drivingTeeth: 0,
        drivenTeeth: 40,
        inputSpeed: 1000,
        inputTorque: 10,
        efficiency: 1.0,
      });

      expect(result.gearRatio).toBe(0);
      expect(result.outputSpeed).toBe(0);
      expect(result.outputTorque).toBe(0);
      expect(result.mechanicalAdvantage).toBe(0);
    });

    it('should handle zero input speed', () => {
      const result = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 40,
        inputSpeed: 0,
        inputTorque: 10,
        efficiency: 1.0,
      });

      expect(result.gearRatio).toBe(2);
      expect(result.outputSpeed).toBe(0);
    });

    it('should handle zero input torque', () => {
      const result = gearRatio({
        drivingTeeth: 20,
        drivenTeeth: 40,
        inputSpeed: 1000,
        inputTorque: 0,
        efficiency: 1.0,
      });

      expect(result.outputTorque).toBe(0);
      expect(result.mechanicalAdvantage).toBe(0); // Fixed: returns 0 instead of NaN
    });
  });

  describe('real-world automotive examples', () => {
    it('should calculate typical first gear ratio', () => {
      // First gear often has high reduction ratio (e.g., 3.5:1)
      const result = gearRatio({
        drivingTeeth: 12,
        drivenTeeth: 42,
        inputSpeed: 3000,
        inputTorque: 150,
        efficiency: 0.97,
      });

      expect(result.gearRatio).toBe(3.5);
      expect(result.outputSpeed).toBeCloseTo(857.14, 1);
      expect(result.speedReduction).toBe(true);
    });

    it('should calculate overdrive gear ratio', () => {
      // Overdrive has ratio < 1 (e.g., 0.75:1)
      const result = gearRatio({
        drivingTeeth: 40,
        drivenTeeth: 30,
        inputSpeed: 3000,
        inputTorque: 150,
        efficiency: 0.98,
      });

      expect(result.gearRatio).toBe(0.75);
      expect(result.outputSpeed).toBe(4000);
      expect(result.speedReduction).toBe(false);
    });
  });
});
