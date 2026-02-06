import { describe, it, expect } from 'vitest';
import { ventilationRate } from './ventilationRate.js';

describe('ventilationRate', () => {
  describe('basic calculations', () => {
    it('should calculate ventilation for a typical office', () => {
      const result = ventilationRate({
        roomLength: 10,
        roomWidth: 8,
        roomHeight: 3,
        occupants: 20,
        activityLevel: 'sedentary',
        spaceType: 'office',
      });
      // Volume = 240 m³, ACH = 6 (sedentary × 1.0)
      expect(result.roomVolume).toBe(240);
      expect(result.requiredAch).toBe(6);
      expect(result.m3PerHour).toBe(1440);
      // CFM = 1440 × 0.58858 ≈ 847.6
      expect(result.cfm).toBeCloseTo(847.6, 0);
      expect(result.cfmPerPerson).toBeCloseTo(42.4, 0);
    });

    it('should increase ACH for moderate activity', () => {
      const sedentary = ventilationRate({
        roomLength: 10, roomWidth: 8, roomHeight: 3,
        occupants: 20, activityLevel: 'sedentary', spaceType: 'office',
      });
      const moderate = ventilationRate({
        roomLength: 10, roomWidth: 8, roomHeight: 3,
        occupants: 20, activityLevel: 'moderate', spaceType: 'office',
      });
      // moderate multiplier = 1.5
      expect(moderate.requiredAch).toBe(9);
      expect(moderate.m3PerHour).toBeGreaterThan(sedentary.m3PerHour);
    });
  });

  describe('space types', () => {
    it('should use higher ACH for industrial space', () => {
      const result = ventilationRate({
        roomLength: 20, roomWidth: 15, roomHeight: 5,
        occupants: 10, activityLevel: 'sedentary', spaceType: 'industrial',
      });
      // Industrial ACH = 12
      expect(result.requiredAch).toBe(12);
    });

    it('should use highest ACH for gym', () => {
      const result = ventilationRate({
        roomLength: 15, roomWidth: 10, roomHeight: 4,
        occupants: 30, activityLevel: 'heavy', spaceType: 'gym',
      });
      // Gym ACH = 15, heavy multiplier = 2.0
      expect(result.requiredAch).toBe(30);
    });

    it('should accept custom ACH', () => {
      const result = ventilationRate({
        roomLength: 10, roomWidth: 10, roomHeight: 3,
        occupants: 5, activityLevel: 'sedentary', spaceType: 'custom',
        customAch: 20,
      });
      expect(result.requiredAch).toBe(20);
    });
  });

  describe('unit conversions', () => {
    it('should correctly convert m³/h to L/s', () => {
      const result = ventilationRate({
        roomLength: 10, roomWidth: 10, roomHeight: 3,
        occupants: 10, activityLevel: 'sedentary', spaceType: 'office',
      });
      // m³/h → L/s: 1800 × 0.27778 ≈ 500
      expect(result.litersPerSecond).toBeCloseTo(500, 0);
    });
  });

  describe('validation', () => {
    it('should throw on zero dimensions', () => {
      expect(() => ventilationRate({
        roomLength: 0, roomWidth: 10, roomHeight: 3,
        occupants: 10, activityLevel: 'sedentary', spaceType: 'office',
      })).toThrow();
    });

    it('should throw on zero occupants', () => {
      expect(() => ventilationRate({
        roomLength: 10, roomWidth: 10, roomHeight: 3,
        occupants: 0, activityLevel: 'sedentary', spaceType: 'office',
      })).toThrow();
    });

    it('should throw when custom type has no ACH', () => {
      expect(() => ventilationRate({
        roomLength: 10, roomWidth: 10, roomHeight: 3,
        occupants: 5, activityLevel: 'sedentary', spaceType: 'custom',
      })).toThrow();
    });
  });
});
