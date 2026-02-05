import { describe, it, expect } from 'vitest';
import { pressTonnage } from './pressTonnage.js';

describe('pressTonnage', () => {
  describe('blanking operation', () => {
    it('should calculate blanking force', () => {
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 200, // mm
      });

      expect(result.blankingForce).toBeGreaterThan(0);
      expect(result.bendingForce).toBe(0);
      expect(result.drawingForce).toBe(0);
    });

    it('should increase force with larger perimeter', () => {
      const small = pressTonnage({
        operation: 'blanking',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 100,
      });

      const large = pressTonnage({
        operation: 'blanking',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 300,
      });

      expect(large.blankingForce).toBeGreaterThan(small.blankingForce);
    });

    it('should increase force with thicker material', () => {
      const thin = pressTonnage({
        operation: 'blanking',
        thickness: 1,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 200,
      });

      const thick = pressTonnage({
        operation: 'blanking',
        thickness: 4,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 200,
      });

      expect(thick.blankingForce).toBeGreaterThan(thin.blankingForce);
    });
  });

  describe('bending operation', () => {
    it('should calculate bending force for air bend', () => {
      const result = pressTonnage({
        operation: 'bending',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        bendLength: 500,
        bendType: 'air',
      });

      expect(result.bendingForce).toBeGreaterThan(0);
      expect(result.blankingForce).toBe(0);
    });

    it('should require more force for bottoming bend', () => {
      const air = pressTonnage({
        operation: 'bending',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        bendLength: 500,
        bendType: 'air',
      });

      const bottoming = pressTonnage({
        operation: 'bending',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        bendLength: 500,
        bendType: 'bottoming',
      });

      expect(bottoming.bendingForce).toBeGreaterThan(air.bendingForce);
    });

    it('should require most force for coining', () => {
      const air = pressTonnage({
        operation: 'bending',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        bendLength: 500,
        bendType: 'air',
      });

      const coining = pressTonnage({
        operation: 'bending',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        bendLength: 500,
        bendType: 'coining',
      });

      expect(coining.bendingForce).toBeGreaterThan(air.bendingForce * 2);
    });
  });

  describe('drawing operation', () => {
    it('should calculate drawing force', () => {
      const result = pressTonnage({
        operation: 'drawing',
        thickness: 1.5,
        tensileStrength: 300,
        shearStrength: 225,
        punchDiameter: 100,
        drawRatio: 0.7,
      });

      expect(result.drawingForce).toBeGreaterThan(0);
    });
  });

  describe('recommended press', () => {
    it('should recommend press tonnage with safety factor', () => {
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 200,
        safetyFactor: 1.25,
      });

      expect(result.recommendedPress).toBeGreaterThan(0);
      // Should be rounded to nearest 10 tons
      expect(result.recommendedPress % 10).toBe(0);
    });
  });

  describe('combined operation', () => {
    it('should return zeros for combined without explicit operations', () => {
      const result = pressTonnage({
        operation: 'combined',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
      });

      expect(result.totalForce).toBe(0);
    });
  });

  describe('breakdown', () => {
    it('should provide operation breakdown', () => {
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 200,
      });

      expect(result.breakdown.length).toBeGreaterThan(0);
      expect(result.breakdown[0].operation).toBe('blanking');
    });
  });

  describe('edge cases', () => {
    it('should handle very thin material', () => {
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 0.5,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 100,
      });

      expect(result.blankingForce).toBeGreaterThan(0);
    });

    it('should handle high strength material', () => {
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 2,
        tensileStrength: 1200, // High strength steel
        shearStrength: 900,
        cuttingPerimeter: 200,
      });

      expect(result.blankingForce).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for automotive stamping', () => {
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 1.2,
        tensileStrength: 340,
        shearStrength: 260,
        cuttingPerimeter: 800, // Large panel perimeter
      });

      expect(result.recommendedPress).toBeGreaterThan(20);
    });

    it('should calculate for press brake bending', () => {
      const result = pressTonnage({
        operation: 'bending',
        thickness: 3,
        tensileStrength: 450,
        shearStrength: 340,
        bendLength: 2000, // 2m bend
        bendType: 'air',
        dieOpening: 24, // 8x thickness
      });

      expect(result.recommendedPress).toBeGreaterThan(50);
    });
  });
});
