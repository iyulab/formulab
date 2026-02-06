import { describe, it, expect } from 'vitest';
import { metalWeight } from './metalWeight.js';

describe('metalWeight', () => {
  describe('plate shape', () => {
    it('should calculate weight for steel plate', () => {
      const result = metalWeight({
        shape: 'plate',
        materialName: 'steel',
        length: 1000, // mm
        width: 500,   // mm
        thickness: 10, // mm
      });

      // Volume = 1000 * 500 * 10 = 5,000,000 mm³ = 5000 cm³
      // Weight = 5000 * 7.85 / 1000 = 39.25 kg
      expect(result.volume).toBeCloseTo(5000, 0);
      expect(result.weight).toBeCloseTo(39.25, 2);
      expect(result.density).toBe(7.85);
    });

    it('should calculate weight for aluminum plate', () => {
      const result = metalWeight({
        shape: 'plate',
        materialName: 'aluminum',
        length: 1000,
        width: 500,
        thickness: 10,
      });

      // Volume = 5000 cm³
      // Weight = 5000 * 2.70 / 1000 = 13.5 kg
      expect(result.weight).toBeCloseTo(13.5, 2);
      expect(result.density).toBe(2.70);
    });
  });

  describe('round shape', () => {
    it('should calculate weight for steel round bar', () => {
      const result = metalWeight({
        shape: 'round',
        materialName: 'steel',
        length: 1000,
        diameter: 50, // mm
      });

      // Cross section = π * (25)² = 1963.495 mm²
      // Volume = 1963.495 * 1000 = 1,963,495 mm³ = 1963.495 cm³
      // Weight = 1963.495 * 7.85 / 1000 = 15.41 kg
      expect(result.weight).toBeCloseTo(15.41, 1);
    });

    it('should calculate weight for copper round bar', () => {
      const result = metalWeight({
        shape: 'round',
        materialName: 'copper',
        length: 500,
        diameter: 20,
      });

      // Cross section = π * (10)² = 314.159 mm²
      // Volume = 314.159 * 500 = 157,079.6 mm³ = 157.08 cm³
      // Weight = 157.08 * 8.96 / 1000 = 1.407 kg
      expect(result.weight).toBeCloseTo(1.41, 1);
      expect(result.density).toBe(8.96);
    });
  });

  describe('pipe shape', () => {
    it('should calculate weight for steel pipe', () => {
      const result = metalWeight({
        shape: 'pipe',
        materialName: 'steel',
        length: 1000,
        outerDiameter: 60,
        innerDiameter: 50,
      });

      // Outer area = π * 30² = 2827.43 mm²
      // Inner area = π * 25² = 1963.50 mm²
      // Cross section = 2827.43 - 1963.50 = 863.94 mm²
      // Volume = 863.94 * 1000 = 863,940 mm³ = 863.94 cm³
      // Weight = 863.94 * 7.85 / 1000 = 6.78 kg
      expect(result.weight).toBeCloseTo(6.78, 1);
    });
  });

  describe('angle shape', () => {
    it('should calculate weight for steel L-angle', () => {
      const result = metalWeight({
        shape: 'angle',
        materialName: 'steel',
        length: 1000,
        width: 50,     // mm (one leg)
        height: 50,    // mm (other leg)
        thickness: 5,  // mm
      });

      // Cross section = (50*5) + (50*5) - (5*5) = 250 + 250 - 25 = 475 mm²
      // Volume = 475 * 1000 = 475,000 mm³ = 475 cm³
      // Weight = 475 * 7.85 / 1000 = 3.729 kg
      expect(result.weight).toBeCloseTo(3.73, 1);
    });
  });

  describe('different materials', () => {
    const materials = [
      { name: 'steel', density: 7.85 },
      { name: 'stainless304', density: 7.93 },
      { name: 'aluminum', density: 2.70 },
      { name: 'copper', density: 8.96 },
      { name: 'brass', density: 8.50 },
      { name: 'titanium', density: 4.50 },
    ];

    materials.forEach(({ name, density }) => {
      it(`should use correct density for ${name}`, () => {
        const result = metalWeight({
          shape: 'plate',
          materialName: name,
          length: 100,
          width: 100,
          thickness: 10,
        });

        expect(result.density).toBe(density);
      });
    });
  });

  describe('type safety', () => {
    it('should work with all valid material names', () => {
      const materials = ['steel', 'stainless304', 'aluminum', 'copper', 'brass', 'titanium'] as const;
      for (const mat of materials) {
        const result = metalWeight({
          shape: 'plate',
          materialName: mat,
          length: 100,
          width: 100,
          thickness: 10,
        });
        expect(result.weight).toBeGreaterThan(0);
      }
    });
  });
});
