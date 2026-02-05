import { describe, it, expect } from 'vitest';
import { bendAllowance } from './bendAllowance.js';

describe('bendAllowance', () => {
  describe('basic calculations', () => {
    it('should calculate bend allowance for 90 degree bend in mild steel', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
      expect(result.bendDeduction).toBeGreaterThan(0);
      expect(result.outsideSetback).toBeGreaterThan(0);
      expect(result.kFactor).toBe(0.44);
    });

    it('should calculate bend allowance for 45 degree bend', () => {
      const result = bendAllowance({
        thickness: 1.5,
        bendAngle: 45,
        insideRadius: 2,
        material: 'mildSteel',
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
      expect(result.bendAllowance).toBeLessThan(
        bendAllowance({ thickness: 1.5, bendAngle: 90, insideRadius: 2, material: 'mildSteel' }).bendAllowance
      );
    });

    it('should increase bend allowance with larger angle', () => {
      const small = bendAllowance({ thickness: 2, bendAngle: 45, insideRadius: 3, material: 'mildSteel' });
      const large = bendAllowance({ thickness: 2, bendAngle: 135, insideRadius: 3, material: 'mildSteel' });

      expect(large.bendAllowance).toBeGreaterThan(small.bendAllowance);
    });
  });

  describe('material types', () => {
    it('should use correct K-factor for stainless304', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 4,
        material: 'stainless304',
      });

      expect(result.kFactor).toBe(0.45);
    });

    it('should use correct K-factor for aluminum5052', () => {
      const result = bendAllowance({
        thickness: 1.5,
        bendAngle: 90,
        insideRadius: 2,
        material: 'aluminum5052',
      });

      expect(result.kFactor).toBe(0.40);
    });

    it('should use correct K-factor for aluminum6061', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'aluminum6061',
      });

      expect(result.kFactor).toBe(0.42);
    });
  });

  describe('custom K-factor', () => {
    it('should use provided K-factor when specified', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        kFactor: 0.33,
      });

      expect(result.kFactor).toBe(0.33);
    });
  });

  describe('V-die recommendations', () => {
    it('should recommend V-die opening based on thickness', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
      });

      // V-die = 8 x thickness = 16mm
      expect(result.recommendedVDie).toBe(16);
    });

    it('should recommend larger V-die for thicker material', () => {
      const thin = bendAllowance({ thickness: 1, bendAngle: 90, insideRadius: 2, material: 'mildSteel' });
      const thick = bendAllowance({ thickness: 4, bendAngle: 90, insideRadius: 5, material: 'mildSteel' });

      expect(thick.recommendedVDie).toBeGreaterThan(thin.recommendedVDie);
    });
  });

  describe('minimum bend radius', () => {
    it('should calculate min bend radius for mild steel', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 2,
        material: 'mildSteel',
      });

      // Min bend radius = 1.0 x thickness = 2mm
      expect(result.minBendRadius).toBe(2);
    });

    it('should calculate larger min bend radius for stainless', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 4,
        material: 'stainless304',
      });

      // Min bend radius = 2.0 x thickness = 4mm
      expect(result.minBendRadius).toBe(4);
    });
  });

  describe('warnings', () => {
    it('should warn when inside radius is less than minimum', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 1, // Less than 2mm minimum
        material: 'mildSteel',
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('less than minimum');
    });

    it('should warn for extreme bend angles', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 175,
        insideRadius: 3,
        material: 'mildSteel',
      });

      expect(result.warnings.some(w => w.includes('springback'))).toBe(true);
    });

    it('should not warn for normal parameters', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
      });

      expect(result.warnings.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very small angle', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 10,
        insideRadius: 3,
        material: 'mildSteel',
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
    });

    it('should handle thick material', () => {
      const result = bendAllowance({
        thickness: 10,
        bendAngle: 90,
        insideRadius: 15,
        material: 'mildSteel',
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
      expect(result.recommendedVDie).toBe(80);
    });
  });
});
