import { describe, it, expect } from 'vitest';
import { bearing } from './bearing.js';

describe('bearing', () => {
  describe('ball bearing life calculation', () => {
    it('should calculate L10 life for ball bearing', () => {
      // L10 = (C/P)^3 million revolutions
      // C = 50 kN, P = 10 kN → L10 = (50/10)^3 = 125 million rev
      const result = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 1000,
      });

      expect(result.l10).toBe(125);
      expect(result.lifeExponent).toBe(3);
    });

    it('should calculate L10h (hours) for ball bearing', () => {
      const result = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 1000,
      });

      // L10h = L10 × 10^6 / (60 × rpm) = 125 × 10^6 / 60000 ≈ 2083 hours
      expect(result.l10h).toBeCloseTo(2083, 0);
    });

    it('should show higher load reduces life', () => {
      const lightLoad = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 1000,
      });

      const heavyLoad = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 50,
        equivalentLoad: 20, // Double the load
        rpm: 1000,
      });

      // L10 = (50/20)^3 = 2.5^3 = 15.625
      expect(heavyLoad.l10).toBe(15.63);
      expect(heavyLoad.l10).toBeLessThan(lightLoad.l10);
    });

    it('should show higher RPM reduces life hours', () => {
      const slowSpeed = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 500,
      });

      const fastSpeed = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 2000,
      });

      expect(fastSpeed.l10h).toBeLessThan(slowSpeed.l10h);
      // Same L10 revolutions, but different hours
      expect(fastSpeed.l10).toBe(slowSpeed.l10);
    });
  });

  describe('roller bearing life calculation', () => {
    it('should use different exponent for roller bearing', () => {
      const result = bearing({
        bearingType: 'roller',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 1000,
      });

      // Roller: exponent = 10/3 ≈ 3.333
      expect(result.lifeExponent).toBeCloseTo(3.333, 2);
    });

    it('should calculate L10 for roller bearing', () => {
      // L10 = (C/P)^(10/3) = 5^(10/3) = 5^3.333 ≈ 213.75
      const result = bearing({
        bearingType: 'roller',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 1000,
      });

      expect(result.l10).toBeCloseTo(213.75, 1);
    });

    it('should show roller bearing has longer life than ball for same conditions', () => {
      const ball = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 1000,
      });

      const roller = bearing({
        bearingType: 'roller',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 1000,
      });

      // Roller has higher exponent, so longer life
      expect(roller.l10).toBeGreaterThan(ball.l10);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero dynamic load rating', () => {
      const result = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 0,
        equivalentLoad: 10,
        rpm: 1000,
      });

      expect(result.l10).toBe(0);
      expect(result.l10h).toBe(0);
    });

    it('should return zeros for zero equivalent load', () => {
      const result = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 50,
        equivalentLoad: 0,
        rpm: 1000,
      });

      expect(result.l10).toBe(0);
      expect(result.l10h).toBe(0);
    });

    it('should return zeros for zero RPM', () => {
      const result = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 50,
        equivalentLoad: 10,
        rpm: 0,
      });

      expect(result.l10).toBe(0);
      expect(result.l10h).toBe(0);
    });

    it('should return zeros for negative values', () => {
      const result = bearing({
        bearingType: 'ball',
        dynamicLoadRating: -50,
        equivalentLoad: 10,
        rpm: 1000,
      });

      expect(result.l10).toBe(0);
    });
  });

  describe('real-world examples', () => {
    it('should calculate typical industrial bearing life', () => {
      // Typical 6205 deep groove ball bearing
      // C = 14 kN, P = 2.5 kN, n = 1500 rpm
      const result = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 14,
        equivalentLoad: 2.5,
        rpm: 1500,
      });

      // L10 = (14/2.5)^3 = 5.6^3 ≈ 175.6
      expect(result.l10).toBeCloseTo(175.62, 1);
      // L10h = 175.6 × 10^6 / (60 × 1500) ≈ 1951 hours
      expect(result.l10h).toBeCloseTo(1951, 0);
    });

    it('should calculate high-load short-life scenario', () => {
      // C/P ratio close to 1
      const result = bearing({
        bearingType: 'ball',
        dynamicLoadRating: 10,
        equivalentLoad: 8,
        rpm: 3000,
      });

      // L10 = (10/8)^3 = 1.25^3 ≈ 1.95
      expect(result.l10).toBeCloseTo(1.95, 1);
      // Very short life hours
      expect(result.l10h).toBeLessThan(15);
    });
  });
});
