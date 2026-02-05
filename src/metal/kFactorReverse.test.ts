import { describe, it, expect } from 'vitest';
import { kFactorReverse } from './kFactorReverse.js';

describe('kFactorReverse', () => {
  describe('basic K-factor calculation', () => {
    it('should reverse calculate K-factor from measured flat length', () => {
      const result = kFactorReverse({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        measuredFlatLength: 75,
        legA: 50,
        legB: 30,
      });

      expect(result.kFactor).toBeGreaterThan(0);
      expect(result.kFactor).toBeLessThan(1);
    });

    it('should return typical K-factor range for standard bend', () => {
      // For R=3, T=2, K≈0.44
      // OSSB = (3+2) × tan(45°) = 5
      // BA = (π/2) × (3 + 0.44 × 2) ≈ 6.1
      // BD = 2×5 - 6.1 = 3.9
      // measuredFlatLength = 50 + 30 - 3.9 = 76.1
      const result = kFactorReverse({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        measuredFlatLength: 76.1,
        legA: 50,
        legB: 30,
      });

      // Typical K-factor is between 0.3 and 0.5
      expect(result.kFactor).toBeGreaterThan(0.3);
      expect(result.kFactor).toBeLessThan(0.6);
    });
  });

  describe('different bend angles', () => {
    it('should calculate K-factor for 45 degree bend', () => {
      // For 45° bend, R=3, T=2, K≈0.44
      // halfAngle = 22.5°, tan(22.5°) ≈ 0.414
      // OSSB = (3+2) × 0.414 ≈ 2.07
      // BA = (π/4) × (3 + 0.44 × 2) ≈ 3.05
      // BD = 2×2.07 - 3.05 ≈ 1.09
      // measuredFlatLength = 50 + 30 - 1.09 ≈ 78.9
      const result = kFactorReverse({
        thickness: 2,
        bendAngle: 45,
        insideRadius: 3,
        measuredFlatLength: 78.9,
        legA: 50,
        legB: 30,
      });

      expect(result.kFactor).toBeGreaterThan(0);
    });

    it('should calculate K-factor for 120 degree bend', () => {
      const result = kFactorReverse({
        thickness: 2,
        bendAngle: 120,
        insideRadius: 3,
        measuredFlatLength: 72,
        legA: 50,
        legB: 30,
      });

      expect(result.kFactor).toBeGreaterThan(0);
    });
  });

  describe('thickness variations', () => {
    it('should work with thin material', () => {
      const result = kFactorReverse({
        thickness: 1,
        bendAngle: 90,
        insideRadius: 1.5,
        measuredFlatLength: 38,
        legA: 25,
        legB: 15,
      });

      expect(result.kFactor).toBeGreaterThan(0);
    });

    it('should work with thick material', () => {
      // For thick material with R=8, T=5, K≈0.44
      // OSSB = (8+5) × tan(45°) = 13
      // BA = (π/2) × (8 + 0.44 × 5) ≈ 16.0
      // BD = 2×13 - 16 = 10
      // measuredFlatLength = 100 + 60 - 10 = 150
      const result = kFactorReverse({
        thickness: 5,
        bendAngle: 90,
        insideRadius: 8,
        measuredFlatLength: 150,
        legA: 100,
        legB: 60,
      });

      expect(result.kFactor).toBeGreaterThan(0);
    });
  });

  describe('radius variations', () => {
    it('should handle tight radius bend', () => {
      // For R=T=2, K≈0.44
      // OSSB = (2+2) × tan(45°) = 4
      // BA = (π/2) × (2 + 0.44 × 2) ≈ 4.5
      // BD = 2×4 - 4.5 = 3.5
      // measuredFlatLength = 50 + 30 - 3.5 = 76.5
      const result = kFactorReverse({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 2, // Equal to thickness
        measuredFlatLength: 76.5,
        legA: 50,
        legB: 30,
      });

      expect(result.kFactor).toBeGreaterThan(0);
    });

    it('should handle large radius bend', () => {
      const result = kFactorReverse({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 10,
        measuredFlatLength: 78,
        legA: 50,
        legB: 30,
      });

      expect(result.kFactor).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should determine K-factor for aluminum bracket', () => {
      // For 90° bend with R=2, T=1.5, K≈0.42
      // OSSB = (2+1.5) × tan(45°) = 3.5
      // BA = (π/2) × (2 + 0.42 × 1.5) ≈ 4.13
      // BD = 2×3.5 - 4.13 = 2.87
      // measuredFlatLength = 40 + 30 - 2.87 = 67.13
      const result = kFactorReverse({
        thickness: 1.5,
        bendAngle: 90,
        insideRadius: 2,
        measuredFlatLength: 67.1,
        legA: 40,
        legB: 30,
      });

      // Aluminum typically has K-factor around 0.40-0.42
      expect(result.kFactor).toBeGreaterThan(0.35);
      expect(result.kFactor).toBeLessThan(0.50);
    });

    it('should determine K-factor for steel channel', () => {
      // For 90° bend with R=4, T=3, K≈0.44
      // OSSB = (4+3) × tan(45°) = 7
      // BA = (π/2) × (4 + 0.44 × 3) ≈ 8.36
      // BD = 2×7 - 8.36 = 5.64
      // measuredFlatLength = 100 + 80 - 5.64 = 174.36
      const result = kFactorReverse({
        thickness: 3,
        bendAngle: 90,
        insideRadius: 4,
        measuredFlatLength: 174.4,
        legA: 100,
        legB: 80,
      });

      // Steel typically has K-factor around 0.44
      expect(result.kFactor).toBeGreaterThan(0.38);
      expect(result.kFactor).toBeLessThan(0.52);
    });
  });
});
