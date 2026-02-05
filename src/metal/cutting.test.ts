import { describe, it, expect } from 'vitest';
import { cutting } from './cutting.js';

describe('cutting', () => {
  describe('RPM calculation', () => {
    it('should calculate RPM correctly', () => {
      // RPM = 1000 × Vc / (π × D)
      // Vc = 100 m/min, D = 10mm → RPM = 1000 × 100 / (π × 10) ≈ 3183
      const result = cutting({
        operation: 'turning',
        cuttingSpeed: 100,
        toolDiameter: 10,
        feedPerRev: 0.2,
        depthOfCut: 2,
      });

      expect(result.rpm).toBeCloseTo(3183, 0);
    });

    it('should handle larger diameter (lower RPM)', () => {
      const result = cutting({
        operation: 'turning',
        cuttingSpeed: 100,
        toolDiameter: 50,
        feedPerRev: 0.2,
        depthOfCut: 2,
      });

      // RPM = 1000 × 100 / (π × 50) ≈ 637
      expect(result.rpm).toBeCloseTo(637, 0);
    });
  });

  describe('turning operation', () => {
    it('should calculate feed rate for turning', () => {
      const result = cutting({
        operation: 'turning',
        cuttingSpeed: 100,
        toolDiameter: 10,
        feedPerRev: 0.2,
        depthOfCut: 2,
      });

      // Feed rate = RPM × f = 3183 × 0.2 ≈ 636.6 mm/min
      expect(result.feedRate).toBeCloseTo(636.6, 0);
    });

    it('should calculate MRR for turning', () => {
      const result = cutting({
        operation: 'turning',
        cuttingSpeed: 100,
        toolDiameter: 10,
        feedPerRev: 0.2,
        depthOfCut: 2,
      });

      // MRR = feedRate × ap / 1000 = 636.6 × 2 / 1000 ≈ 1.27 cm³/min
      expect(result.mrr).toBeCloseTo(1.27, 1);
    });
  });

  describe('milling operation', () => {
    it('should calculate feed rate for milling', () => {
      const result = cutting({
        operation: 'milling',
        cuttingSpeed: 150,
        toolDiameter: 20,
        feedPerTooth: 0.1,
        numberOfTeeth: 4,
        depthOfCut: 3,
        widthOfCut: 10,
      });

      // RPM = 1000 × 150 / (π × 20) ≈ 2387
      // Feed rate = RPM × fz × z = 2387 × 0.1 × 4 ≈ 954.9 mm/min
      expect(result.rpm).toBeCloseTo(2387, 0);
      expect(result.feedRate).toBeCloseTo(954.9, 0);
    });

    it('should calculate MRR for milling', () => {
      const result = cutting({
        operation: 'milling',
        cuttingSpeed: 150,
        toolDiameter: 20,
        feedPerTooth: 0.1,
        numberOfTeeth: 4,
        depthOfCut: 3,
        widthOfCut: 10,
      });

      // MRR = ae × ap × Vf / 1000 = 10 × 3 × 954.9 / 1000 ≈ 28.65 cm³/min
      expect(result.mrr).toBeCloseTo(28.65, 0);
    });
  });

  describe('drilling operation', () => {
    it('should calculate feed rate for drilling', () => {
      const result = cutting({
        operation: 'drilling',
        cuttingSpeed: 30,
        toolDiameter: 8,
        feedPerRev: 0.15,
      });

      // RPM = 1000 × 30 / (π × 8) ≈ 1194
      // Feed rate = RPM × f = 1194 × 0.15 ≈ 179.1 mm/min
      expect(result.rpm).toBeCloseTo(1194, 0);
      expect(result.feedRate).toBeCloseTo(179.1, 0);
    });

    it('should calculate MRR for drilling', () => {
      const result = cutting({
        operation: 'drilling',
        cuttingSpeed: 30,
        toolDiameter: 8,
        feedPerRev: 0.15,
      });

      // MRR = π/4 × D² × f × n / 1000
      // = π/4 × 64 × 0.15 × 1194 / 1000 ≈ 9.0 cm³/min
      expect(result.mrr).toBeCloseTo(9.0, 0);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero tool diameter', () => {
      const result = cutting({
        operation: 'turning',
        cuttingSpeed: 100,
        toolDiameter: 0,
        feedPerRev: 0.2,
        depthOfCut: 2,
      });

      expect(result.rpm).toBe(0);
      expect(result.feedRate).toBe(0);
      expect(result.mrr).toBe(0);
    });

    it('should return zeros for negative tool diameter', () => {
      const result = cutting({
        operation: 'turning',
        cuttingSpeed: 100,
        toolDiameter: -10,
        feedPerRev: 0.2,
        depthOfCut: 2,
      });

      expect(result.rpm).toBe(0);
    });

    it('should handle zero feed per rev', () => {
      const result = cutting({
        operation: 'turning',
        cuttingSpeed: 100,
        toolDiameter: 10,
        feedPerRev: 0,
        depthOfCut: 2,
      });

      expect(result.rpm).toBeGreaterThan(0);
      expect(result.feedRate).toBe(0);
      expect(result.mrr).toBe(0);
    });

    it('should handle missing optional parameters', () => {
      const result = cutting({
        operation: 'milling',
        cuttingSpeed: 100,
        toolDiameter: 10,
      });

      expect(result.rpm).toBeGreaterThan(0);
      expect(result.feedRate).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle aluminum high-speed cutting', () => {
      const result = cutting({
        operation: 'milling',
        cuttingSpeed: 300, // Aluminum allows high speed
        toolDiameter: 12,
        feedPerTooth: 0.08,
        numberOfTeeth: 3,
        depthOfCut: 5,
        widthOfCut: 6,
      });

      expect(result.rpm).toBeCloseTo(7958, 0);
      expect(result.feedRate).toBeGreaterThan(1500);
    });

    it('should handle steel moderate cutting', () => {
      const result = cutting({
        operation: 'turning',
        cuttingSpeed: 80, // Steel requires lower speed
        toolDiameter: 25,
        feedPerRev: 0.25,
        depthOfCut: 3,
      });

      expect(result.rpm).toBeCloseTo(1019, 0);
    });
  });
});
