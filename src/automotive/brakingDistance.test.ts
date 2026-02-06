import { describe, it, expect } from 'vitest';
import { brakingDistance } from './brakingDistance.js';

describe('brakingDistance', () => {
  describe('basic calculations', () => {
    it('should calculate stopping distance at 60 km/h on dry road', () => {
      const result = brakingDistance({
        speed: 60,
        friction: 0.7,
        reactionTime: 1.5,
        grade: 0,
      });
      // v = 60/3.6 = 16.667 m/s
      expect(result.speedMps).toBeCloseTo(16.67, 1);
      // Reaction distance = 16.667 * 1.5 = 25 m
      expect(result.reactionDistance).toBe(25);
      // Braking distance = 16.667^2 / (2 * 9.81 * 0.7) = 277.78 / 13.734 ≈ 20.23
      expect(result.brakingDistance).toBeCloseTo(20.23, 1);
      expect(result.totalStoppingDistance).toBeCloseTo(45.23, 1);
      expect(result.deceleration).toBeCloseTo(6.87, 1);
    });

    it('should calculate stopping distance at 100 km/h', () => {
      const result = brakingDistance({
        speed: 100,
        friction: 0.7,
        reactionTime: 2.5, // AASHTO design value
        grade: 0,
      });
      // v = 27.778 m/s
      expect(result.speedMps).toBeCloseTo(27.78, 1);
      // Reaction = 27.778 * 2.5 = 69.44 m
      expect(result.reactionDistance).toBeCloseTo(69.44, 1);
      // Braking = 27.778^2 / (2*9.81*0.7) = 771.60/13.734 ≈ 56.18 m
      expect(result.brakingDistance).toBeCloseTo(56.18, 1);
    });
  });

  describe('grade effects', () => {
    it('should reduce stopping distance on uphill grade', () => {
      const flat = brakingDistance({ speed: 80, friction: 0.7, reactionTime: 1.5, grade: 0 });
      const uphill = brakingDistance({ speed: 80, friction: 0.7, reactionTime: 1.5, grade: 5 });
      expect(uphill.brakingDistance).toBeLessThan(flat.brakingDistance);
      // Reaction distances should be equal
      expect(uphill.reactionDistance).toBe(flat.reactionDistance);
    });

    it('should increase stopping distance on downhill grade', () => {
      const flat = brakingDistance({ speed: 80, friction: 0.7, reactionTime: 1.5, grade: 0 });
      const downhill = brakingDistance({ speed: 80, friction: 0.7, reactionTime: 1.5, grade: -5 });
      expect(downhill.brakingDistance).toBeGreaterThan(flat.brakingDistance);
    });
  });

  describe('wet road conditions', () => {
    it('should show longer stopping on wet road (f=0.4)', () => {
      const dry = brakingDistance({ speed: 60, friction: 0.7, reactionTime: 1.5, grade: 0 });
      const wet = brakingDistance({ speed: 60, friction: 0.4, reactionTime: 1.5, grade: 0 });
      expect(wet.brakingDistance).toBeGreaterThan(dry.brakingDistance);
    });
  });

  describe('validation', () => {
    it('should throw on zero speed', () => {
      expect(() => brakingDistance({ speed: 0, friction: 0.7, reactionTime: 1.5, grade: 0 })).toThrow();
    });

    it('should throw on zero friction', () => {
      expect(() => brakingDistance({ speed: 60, friction: 0, reactionTime: 1.5, grade: 0 })).toThrow();
    });

    it('should throw when downhill grade overcomes friction', () => {
      // grade = -80% → effective friction = 0.7 - 0.8 = -0.1
      expect(() => brakingDistance({ speed: 60, friction: 0.7, reactionTime: 1.5, grade: -80 })).toThrow();
    });
  });
});
