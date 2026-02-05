import { describe, it, expect } from 'vitest';
import { stencilAperture } from './stencil.js';

describe('stencilAperture', () => {
  describe('rectangular aperture calculations', () => {
    it('should calculate aperture area correctly', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.5, // mm
        apertureLength: 1.0, // mm
        stencilThickness: 0.12,
        componentType: 'qfp',
      });

      // Area = 0.5 × 1.0 = 0.5 mm²
      expect(result.apertureArea).toBeCloseTo(0.5, 3);
    });

    it('should calculate wall area correctly', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.5,
        apertureLength: 1.0,
        stencilThickness: 0.12,
        componentType: 'qfp',
      });

      // Perimeter = 2 × (0.5 + 1.0) = 3.0 mm
      // Wall area = 3.0 × 0.12 = 0.36 mm²
      expect(result.wallArea).toBeCloseTo(0.36, 3);
    });

    it('should calculate area ratio correctly', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.5,
        apertureLength: 1.0,
        stencilThickness: 0.12,
        componentType: 'qfp',
      });

      // Area ratio = aperture area / wall area = 0.5 / 0.36 = 1.39
      expect(result.areaRatio).toBeCloseTo(1.39, 1);
    });

    it('should calculate aspect ratio using smallest dimension', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.5,
        apertureLength: 1.0,
        stencilThickness: 0.12,
        componentType: 'qfp',
      });

      // Aspect ratio = smallest dimension / thickness = 0.5 / 0.12 = 4.17
      expect(result.aspectRatio).toBeCloseTo(4.17, 1);
    });
  });

  describe('circular aperture calculations', () => {
    it('should calculate aperture area correctly', () => {
      const result = stencilAperture({
        shape: 'circle',
        apertureWidth: 0.4, // diameter
        apertureLength: 0, // not used for circle
        stencilThickness: 0.10,
        componentType: 'bga',
      });

      // Area = π × r² = π × 0.2² = 0.1257 mm²
      expect(result.apertureArea).toBeCloseTo(0.1257, 3);
    });

    it('should calculate perimeter as circumference', () => {
      const result = stencilAperture({
        shape: 'circle',
        apertureWidth: 0.4,
        apertureLength: 0,
        stencilThickness: 0.10,
        componentType: 'bga',
      });

      // Perimeter = π × d = π × 0.4 = 1.257 mm
      // Wall area = 1.257 × 0.10 = 0.1257 mm²
      expect(result.wallArea).toBeCloseTo(0.1257, 3);
    });

    it('should use diameter for aspect ratio', () => {
      const result = stencilAperture({
        shape: 'circle',
        apertureWidth: 0.4,
        apertureLength: 0,
        stencilThickness: 0.10,
        componentType: 'bga',
      });

      // Aspect ratio = 0.4 / 0.10 = 4.0
      expect(result.aspectRatio).toBe(4);
    });
  });

  describe('component type recommendations', () => {
    it('should use BGA recommendations', () => {
      const result = stencilAperture({
        shape: 'circle',
        apertureWidth: 0.3,
        apertureLength: 0,
        stencilThickness: 0.10,
        componentType: 'bga',
      });

      expect(result.recommendedAreaRatio).toBe(0.66);
      expect(result.recommendedAspectRatio).toBe(1.5);
    });

    it('should use QFP recommendations', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.25,
        apertureLength: 1.5,
        stencilThickness: 0.12,
        componentType: 'qfp',
      });

      expect(result.recommendedAreaRatio).toBe(0.60);
    });

    it('should use chip component recommendations', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.3,
        apertureLength: 0.5,
        stencilThickness: 0.10,
        componentType: 'chip',
      });

      expect(result.recommendedAreaRatio).toBe(0.50);
    });

    it('should use SOT recommendations', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.4,
        apertureLength: 0.8,
        stencilThickness: 0.12,
        componentType: 'sot',
      });

      expect(result.recommendedAreaRatio).toBe(0.55);
    });

    it('should use general recommendations', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.5,
        apertureLength: 1.0,
        stencilThickness: 0.12,
        componentType: 'general',
      });

      expect(result.recommendedAreaRatio).toBe(0.50);
    });
  });

  describe('status determination', () => {
    it('should return good status when both ratios are OK', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.5,
        apertureLength: 1.0,
        stencilThickness: 0.10,
        componentType: 'general',
      });

      expect(result.areaRatioOk).toBe(true);
      expect(result.aspectRatioOk).toBe(true);
      expect(result.status).toBe('good');
    });

    it('should return marginal status when one ratio fails', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.15, // Too small
        apertureLength: 1.0,
        stencilThickness: 0.10,
        componentType: 'general',
      });

      // Area ratio should fail but aspect ratio might pass
      expect(result.status).toBe('marginal');
    });

    it('should return poor status when both ratios fail', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.1,
        apertureLength: 0.1,
        stencilThickness: 0.15,
        componentType: 'bga',
      });

      expect(result.areaRatioOk).toBe(false);
      expect(result.aspectRatioOk).toBe(false);
      expect(result.status).toBe('poor');
    });
  });

  describe('error handling', () => {
    it('should throw error for zero aperture width', () => {
      expect(() =>
        stencilAperture({
          shape: 'rectangle',
          apertureWidth: 0,
          apertureLength: 1.0,
          stencilThickness: 0.12,
          componentType: 'qfp',
        })
      ).toThrow('Aperture width and stencil thickness must be positive');
    });

    it('should throw error for zero stencil thickness', () => {
      expect(() =>
        stencilAperture({
          shape: 'rectangle',
          apertureWidth: 0.5,
          apertureLength: 1.0,
          stencilThickness: 0,
          componentType: 'qfp',
        })
      ).toThrow('Aperture width and stencil thickness must be positive');
    });

    it('should throw error for rectangle with zero length', () => {
      expect(() =>
        stencilAperture({
          shape: 'rectangle',
          apertureWidth: 0.5,
          apertureLength: 0,
          stencilThickness: 0.12,
          componentType: 'qfp',
        })
      ).toThrow('Aperture length must be positive for rectangular apertures');
    });
  });

  describe('real-world scenarios', () => {
    it('should analyze 0.5mm pitch BGA', () => {
      const result = stencilAperture({
        shape: 'circle',
        apertureWidth: 0.25, // 250µm
        apertureLength: 0,
        stencilThickness: 0.10,
        componentType: 'bga',
      });

      expect(result.aspectRatio).toBe(2.5);
      expect(result.aspectRatioOk).toBe(true);
    });

    it('should analyze 0402 chip component', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.25,
        apertureLength: 0.4,
        stencilThickness: 0.08,
        componentType: 'chip',
      });

      expect(result.status).toBe('good');
    });

    it('should analyze QFP with 0.5mm pitch', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.25,
        apertureLength: 1.5,
        stencilThickness: 0.12,
        componentType: 'qfp',
      });

      expect(result.apertureArea).toBeCloseTo(0.375, 3);
    });

    it('should warn about fine pitch with thick stencil', () => {
      const result = stencilAperture({
        shape: 'rectangle',
        apertureWidth: 0.15, // 0.3mm pitch
        apertureLength: 0.8,
        stencilThickness: 0.15, // Too thick for this pitch
        componentType: 'qfp',
      });

      expect(result.aspectRatioOk).toBe(false);
    });
  });
});
