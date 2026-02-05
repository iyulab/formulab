import { describe, it, expect } from 'vitest';
import { pressTonnage } from '../pressTonnage.js';

describe('pressTonnage', () => {
  describe('blanking operation', () => {
    it('calculates blanking force for circular blank', () => {
      // 100mm diameter circle, 2mm thick mild steel
      // Perimeter = π × 100 = 314.16mm
      // Shear strength = 300 MPa
      // Force = 314.16 × 2 × 300 / 1000 = 188.5 kN
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 314.16,
      });

      expect(result.blankingForce).toBeCloseTo(188.5, 0);
      expect(result.bendingForce).toBe(0);
      expect(result.drawingForce).toBe(0);
      expect(result.blankHolderForce).toBe(0);
      expect(result.recommendedPress).toBeGreaterThan(0);
    });

    it('calculates blanking force for rectangular blank', () => {
      // 200×100mm rectangle, 1.5mm thick
      // Perimeter = 2 × (200 + 100) = 600mm
      // Shear strength = 250 MPa
      // Force = 600 × 1.5 × 250 / 1000 = 225 kN
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 1.5,
        tensileStrength: 350,
        shearStrength: 250,
        cuttingPerimeter: 600,
      });

      expect(result.blankingForce).toBeCloseTo(225, 0);
    });
  });

  describe('bending operation', () => {
    it('calculates air bending force', () => {
      // 1000mm bend length, 3mm thick, 24mm die opening
      // Tensile = 400 MPa, K = 1.33 (air)
      // Force = (1.33 × 1000 × 3² × 400) / (24 × 1000) = 199.5 kN
      const result = pressTonnage({
        operation: 'bending',
        thickness: 3,
        tensileStrength: 400,
        shearStrength: 300,
        bendLength: 1000,
        dieOpening: 24,
        bendType: 'air',
      });

      expect(result.bendingForce).toBeCloseTo(199.5, 0);
      expect(result.blankingForce).toBe(0);
      expect(result.drawingForce).toBe(0);
    });

    it('calculates bottoming bending force', () => {
      // K = 3.0 for bottoming
      const result = pressTonnage({
        operation: 'bending',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        bendLength: 500,
        dieOpening: 16,
        bendType: 'bottoming',
      });

      // Force = (3.0 × 500 × 2² × 400) / (16 × 1000) = 150 kN
      expect(result.bendingForce).toBeCloseTo(150, 0);
    });

    it('calculates coining bending force', () => {
      // K = 8.0 for coining
      const result = pressTonnage({
        operation: 'bending',
        thickness: 1,
        tensileStrength: 400,
        shearStrength: 300,
        bendLength: 200,
        dieOpening: 8,
        bendType: 'coining',
      });

      // Force = (8.0 × 200 × 1² × 400) / (8 × 1000) = 80 kN
      expect(result.bendingForce).toBeCloseTo(80, 0);
    });
  });

  describe('drawing operation - with drawRatio only', () => {
    it('calculates drawing force using Siebel formula when drawRatio provided', () => {
      // When drawRatio is provided, blankDiameter is derived: D = d / drawRatio
      // d = 100mm, drawRatio = 0.7 → D = 142.86mm
      // Then enhanced Siebel formula is used
      const result = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        drawRatio: 0.7,
      });

      // Enhanced mode calculates blank holder force
      expect(result.drawingForce).toBeGreaterThan(50);
      expect(result.drawingForce).toBeLessThan(100);
      expect(result.drawRatio).toBe(0.7);
      expect(result.blankHolderForce).toBeGreaterThan(0); // Calculated from derived D
      expect(result.numberOfDraws).toBe(1); // Single draw for ratio 0.7
    });
  });

  describe('drawing operation - enhanced mode', () => {
    it('calculates drawing force with blank diameter', () => {
      // Enhanced Siebel formula with D and d specified
      // D = 150mm, d = 100mm (ratio = 0.667)
      const result = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        blankDiameter: 150,
      });

      expect(result.drawRatio).toBeCloseTo(0.667, 2);
      expect(result.drawingForce).toBeGreaterThan(0);
      expect(result.blankHolderForce).toBeGreaterThan(0);
      expect(result.numberOfDraws).toBe(1); // Single draw for ratio > 0.55
    });

    it('calculates blank holder force correctly', () => {
      // F_bh = π/4 × (D² - d²) × p_bh
      // D = 200mm, d = 100mm, p_bh = 3 MPa
      // Area = π/4 × (200² - 100²) = 23562 mm²
      // Force = 23562 × 3 / 1000 = 70.7 kN
      const result = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        blankDiameter: 200,
        blankHolderPressure: 3,
      });

      expect(result.blankHolderForce).toBeCloseTo(70.69, 0);
    });

    it('detects multi-draw requirement for deep draws', () => {
      // Draw ratio 0.4 (d/D = 80/200) requires multiple draws
      const result = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 80,
        blankDiameter: 200,
      });

      expect(result.drawRatio).toBeCloseTo(0.4, 1);
      expect(result.numberOfDraws).toBeGreaterThan(1);
      expect(result.warnings.some(w => w.includes('Multi-draw'))).toBe(true);
    });

    it('warns about dangerous draw ratio', () => {
      // Draw ratio 0.3 is below safe limit
      const result = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 60,
        blankDiameter: 200,
      });

      expect(result.drawRatio).toBeCloseTo(0.3, 1);
      expect(result.warnings.some(w => w.includes('below safe limit'))).toBe(true);
    });

    it('includes friction effects in drawing force', () => {
      const lowFriction = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        blankDiameter: 150,
        frictionCoefficient: 0.05,
      });

      const highFriction = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        blankDiameter: 150,
        frictionCoefficient: 0.15,
      });

      // Higher friction = higher drawing force
      expect(highFriction.drawingForce).toBeGreaterThan(lowFriction.drawingForce);
    });

    it('warns about high friction coefficient', () => {
      const result = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        blankDiameter: 150,
        frictionCoefficient: 0.2,
      });

      expect(result.warnings.some(w => w.includes('High friction'))).toBe(true);
    });

    it('warns about blank holder pressure extremes', () => {
      const lowPressure = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        blankDiameter: 150,
        blankHolderPressure: 1,
      });

      const highPressure = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        blankDiameter: 150,
        blankHolderPressure: 6,
      });

      expect(lowPressure.warnings.some(w => w.includes('wrinkling'))).toBe(true);
      expect(highPressure.warnings.some(w => w.includes('thinning'))).toBe(true);
    });
  });

  describe('combined operation', () => {
    it('returns zeros without explicit operations array', () => {
      const result = pressTonnage({
        operation: 'combined',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
      });

      expect(result.blankingForce).toBe(0);
      expect(result.bendingForce).toBe(0);
      expect(result.drawingForce).toBe(0);
      expect(result.totalForce).toBe(0);
      expect(result.recommendedPress).toBe(0);
    });
  });

  describe('recommended press calculation', () => {
    it('applies safety factor correctly', () => {
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 314.16,
        safetyFactor: 1.25,
      });

      // Force = 188.5 kN = 19.2 tons
      // With safety: 19.2 × 1.25 = 24 tons
      // Round up to 30 tons
      expect(result.recommendedPress).toBe(30);
    });

    it('rounds up to nearest 10 tons', () => {
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 1,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 100,
        safetyFactor: 1.0,
      });

      // Small force should round up to 10 tons minimum
      expect(result.recommendedPress % 10).toBe(0);
      expect(result.recommendedPress).toBeGreaterThanOrEqual(10);
    });
  });

  describe('breakdown details', () => {
    it('provides breakdown for blanking operation', () => {
      const result = pressTonnage({
        operation: 'blanking',
        thickness: 2,
        tensileStrength: 400,
        shearStrength: 300,
        cuttingPerimeter: 200,
      });

      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].operation).toBe('blanking');
      expect(result.breakdown[0].force).toBeGreaterThan(0);
    });

    it('provides breakdown for drawing with blank holder', () => {
      const result = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        blankDiameter: 150,
      });

      expect(result.breakdown.length).toBeGreaterThanOrEqual(1);
      expect(result.breakdown.some(b => b.operation === 'drawing')).toBe(true);
      expect(result.breakdown.some(b => b.operation === 'blankHolder')).toBe(true);
    });
  });

  describe('total force calculation', () => {
    it('includes blank holder force in total', () => {
      const result = pressTonnage({
        operation: 'drawing',
        thickness: 1,
        tensileStrength: 300,
        shearStrength: 200,
        punchDiameter: 100,
        blankDiameter: 150,
      });

      // Total should include both drawing and blank holder force
      expect(result.totalForce).toBeCloseTo(
        result.drawingForce + result.blankHolderForce,
        1
      );
    });
  });
});
