import { describe, it, expect } from 'vitest';
import { taktTime } from './takt.js';

describe('taktTime', () => {
  describe('basic calculations', () => {
    it('should calculate takt time in minutes', () => {
      const result = taktTime({
        availableTime: 480,  // 8 hours in minutes
        demand: 240,         // 240 units
        timeUnit: 'minutes',
      });

      // Takt = 480 / 240 = 2 minutes per unit
      expect(result.taktTime).toBe(2);
      // Max rate = 240 / (480/60) = 240 / 8 = 30 units/hour
      expect(result.maxRatePerHour).toBe(30);
    });

    it('should calculate takt time in seconds', () => {
      const result = taktTime({
        availableTime: 3600,  // 1 hour in seconds
        demand: 60,           // 60 units
        timeUnit: 'seconds',
      });

      // Takt = 3600 / 60 = 60 seconds per unit
      expect(result.taktTime).toBe(60);
      // Max rate = 60 / 1 = 60 units/hour
      expect(result.maxRatePerHour).toBe(60);
    });

    it('should calculate takt time in hours', () => {
      const result = taktTime({
        availableTime: 8,   // 8 hours
        demand: 16,         // 16 units
        timeUnit: 'hours',
      });

      // Takt = 8 / 16 = 0.5 hours per unit (30 minutes)
      expect(result.taktTime).toBe(0.5);
      // Max rate = 16 / 8 = 2 units/hour
      expect(result.maxRatePerHour).toBe(2);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for automotive assembly line', () => {
      // 2 shifts x 8 hours = 16 hours, need to produce 480 cars
      const result = taktTime({
        availableTime: 960,  // 16 hours in minutes
        demand: 480,
        timeUnit: 'minutes',
      });

      // Takt = 960 / 480 = 2 minutes per car
      expect(result.taktTime).toBe(2);
      expect(result.maxRatePerHour).toBe(30);
    });

    it('should calculate for high-volume electronics', () => {
      // 8 hours, 4800 PCBs (10 per minute target)
      const result = taktTime({
        availableTime: 28800,  // 8 hours in seconds
        demand: 4800,
        timeUnit: 'seconds',
      });

      // Takt = 28800 / 4800 = 6 seconds per PCB
      expect(result.taktTime).toBe(6);
      // 4800 / 8 = 600 units/hour
      expect(result.maxRatePerHour).toBe(600);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero demand', () => {
      const result = taktTime({
        availableTime: 480,
        demand: 0,
        timeUnit: 'minutes',
      });

      expect(result.taktTime).toBe(0);
      expect(result.maxRatePerHour).toBe(0);
    });

    it('should return zeros for zero available time', () => {
      const result = taktTime({
        availableTime: 0,
        demand: 100,
        timeUnit: 'minutes',
      });

      expect(result.taktTime).toBe(0);
      expect(result.maxRatePerHour).toBe(0);
    });

    it('should return zeros for negative demand', () => {
      const result = taktTime({
        availableTime: 480,
        demand: -10,
        timeUnit: 'minutes',
      });

      expect(result.taktTime).toBe(0);
      expect(result.maxRatePerHour).toBe(0);
    });

    it('should handle fractional takt times', () => {
      const result = taktTime({
        availableTime: 100,
        demand: 300,
        timeUnit: 'minutes',
      });

      // Takt = 100 / 300 = 0.333... minutes per unit
      expect(result.taktTime).toBeCloseTo(0.333, 2);
      // Max rate = 300 / (100/60) = 180 units/hour
      expect(result.maxRatePerHour).toBe(180);
    });
  });
});
