import { describe, it, expect } from 'vitest';
import { flatPattern } from './flatPattern.js';

describe('flatPattern', () => {
  describe('L-shape calculations', () => {
    it('should calculate flat length for L-shape bend', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.flatLength).toBeGreaterThan(0);
      expect(result.flatLength).toBeLessThan(50 + 30); // Less than sum of flanges
    });

    it('should increase flat length with larger flanges', () => {
      const small = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 30,
        flangeB: 20,
      });

      const large = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 60,
        flangeB: 40,
      });

      expect(large.flatLength).toBeGreaterThan(small.flatLength);
    });
  });

  describe('U-shape calculations', () => {
    it('should calculate flat length for U-shape (two bends)', () => {
      const result = flatPattern({
        shapeType: 'uShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 30,
        flangeB: 50,
        flangeC: 30,
      });

      expect(result.flatLength).toBeGreaterThan(0);
      // U-shape subtracts 2 x BD
      expect(result.flatLength).toBeLessThan(30 + 50 + 30);
    });

    it('should have longer flat length for U-shape than L-shape with same flanges', () => {
      const lShape = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 40,
        flangeB: 40,
      });

      const uShape = flatPattern({
        shapeType: 'uShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 40,
        flangeB: 40,
        flangeC: 40,
      });

      expect(uShape.flatLength).toBeGreaterThan(lShape.flatLength);
    });
  });

  describe('material K-factors', () => {
    it('should use correct K-factor for mild steel', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.kFactor).toBe(0.44);
    });

    it('should use correct K-factor for aluminum5052', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'aluminum5052',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.kFactor).toBe(0.40);
    });

    it('should use custom K-factor when provided', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        kFactor: 0.35,
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.kFactor).toBe(0.35);
    });
  });

  describe('bend allowance and deduction', () => {
    it('should calculate bend allowance', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
    });

    it('should calculate bend deduction', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.bendDeduction).toBeGreaterThan(0);
    });
  });

  describe('bend angle variations', () => {
    it('should handle acute bend angle', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 45,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.flatLength).toBeGreaterThan(0);
    });

    it('should handle obtuse bend angle', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 135,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.flatLength).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate bracket flat pattern', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 3,
        bendAngle: 90,
        insideRadius: 4,
        material: 'mildSteel',
        flangeA: 100,
        flangeB: 50,
      });

      expect(result.flatLength).toBeGreaterThan(140);
      expect(result.flatLength).toBeLessThan(150);
    });

    it('should calculate channel flat pattern', () => {
      const result = flatPattern({
        shapeType: 'uShape',
        thickness: 1.5,
        bendAngle: 90,
        insideRadius: 2,
        material: 'aluminum6061',
        flangeA: 25,
        flangeB: 50,
        flangeC: 25,
      });

      expect(result.flatLength).toBeGreaterThan(90);
    });
  });
});
