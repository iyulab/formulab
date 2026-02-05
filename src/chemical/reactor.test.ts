import { describe, it, expect } from 'vitest';
import { reactor } from './reactor.js';

describe('reactor', () => {
  describe('cylindrical reactor', () => {
    it('should calculate total volume correctly', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 1, // 1m
        height: 2, // 2m
        fillRatio: 0.8,
      });

      // V = π × r² × h = π × 0.5² × 2 = π × 0.5 = 1.5708 m³
      expect(result.totalVolume).toBeCloseTo(1.5708, 3);
    });

    it('should calculate working volume with fill ratio', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 1,
        height: 2,
        fillRatio: 0.8,
      });

      // Working = total × 0.8 = 1.5708 × 0.8 = 1.2566 m³
      expect(result.workingVolume).toBeCloseTo(1.2566, 3);
    });

    it('should calculate surface area correctly', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 1,
        height: 2,
        fillRatio: 0.8,
      });

      // Surface = 2πr² + 2πrh = 2π(0.5)² + 2π(0.5)(2)
      // = 2π(0.25) + 2π(1) = 0.5π + 2π = 2.5π = 7.854 m²
      expect(result.surfaceArea).toBeCloseTo(7.854, 2);
    });

    it('should convert volume to liters', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 1,
        height: 2,
        fillRatio: 1.0,
      });

      // 1.5708 m³ × 1000 = 1570.8 L
      expect(result.totalVolumeLiters).toBeCloseTo(1570.8, 0);
    });

    it('should calculate volume to surface ratio', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 1,
        height: 2,
        fillRatio: 0.8,
      });

      // V/S = 1.5708 / 7.854 = 0.2 m
      expect(result.volumeToSurfaceRatio).toBeCloseTo(0.2, 1);
    });
  });

  describe('spherical reactor', () => {
    it('should calculate total volume correctly', () => {
      const result = reactor({
        shape: 'spherical',
        diameter: 2, // 2m
        fillRatio: 0.75,
      });

      // V = (4/3)πr³ = (4/3)π(1)³ = (4/3)π = 4.1888 m³
      expect(result.totalVolume).toBeCloseTo(4.1888, 3);
    });

    it('should calculate surface area correctly', () => {
      const result = reactor({
        shape: 'spherical',
        diameter: 2,
        fillRatio: 0.75,
      });

      // Surface = 4πr² = 4π(1)² = 4π = 12.566 m²
      expect(result.surfaceArea).toBeCloseTo(12.566, 2);
    });

    it('should calculate working volume with fill ratio', () => {
      const result = reactor({
        shape: 'spherical',
        diameter: 2,
        fillRatio: 0.75,
      });

      // Working = 4.1888 × 0.75 = 3.1416 m³
      expect(result.workingVolume).toBeCloseTo(3.1416, 3);
    });

    it('should calculate volume to surface ratio', () => {
      const result = reactor({
        shape: 'spherical',
        diameter: 2,
        fillRatio: 0.75,
      });

      // V/S = 4.1888 / 12.566 = 0.333 m
      expect(result.volumeToSurfaceRatio).toBeCloseTo(0.333, 2);
    });
  });

  describe('fill ratio variations', () => {
    it('should handle 100% fill ratio', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 1,
        height: 1,
        fillRatio: 1.0,
      });

      expect(result.workingVolume).toBe(result.totalVolume);
    });

    it('should handle 50% fill ratio', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 1,
        height: 1,
        fillRatio: 0.5,
      });

      expect(result.workingVolume).toBeCloseTo(result.totalVolume / 2, 4);
    });

    it('should handle very low fill ratio', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 1,
        height: 1,
        fillRatio: 0.1,
      });

      expect(result.workingVolume).toBeCloseTo(result.totalVolume * 0.1, 4);
    });
  });

  describe('edge cases', () => {
    it('should handle small reactor dimensions', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 0.1, // 10 cm
        height: 0.2, // 20 cm
        fillRatio: 0.8,
      });

      // V = π × 0.05² × 0.2 = 0.00157 m³ = 1.57 L
      expect(result.totalVolumeLiters).toBeCloseTo(1.57, 1);
    });

    it('should handle large reactor dimensions', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 10, // 10m
        height: 15, // 15m
        fillRatio: 0.9,
      });

      // V = π × 5² × 15 = 1178.1 m³
      expect(result.totalVolume).toBeCloseTo(1178.1, 0);
    });

    it('should handle zero fill ratio', () => {
      const result = reactor({
        shape: 'cylindrical',
        diameter: 1,
        height: 1,
        fillRatio: 0,
      });

      expect(result.workingVolume).toBe(0);
      expect(result.workingVolumeLiters).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate lab-scale bioreactor (10L)', () => {
      // Typical 10L bioreactor: D=0.2m, H=0.35m
      const result = reactor({
        shape: 'cylindrical',
        diameter: 0.2,
        height: 0.35,
        fillRatio: 0.7,
      });

      expect(result.totalVolumeLiters).toBeCloseTo(11, 0);
      expect(result.workingVolumeLiters).toBeCloseTo(7.7, 0);
    });

    it('should calculate pilot-scale reactor (500L)', () => {
      // Pilot reactor: D=0.6m, H=1.8m
      const result = reactor({
        shape: 'cylindrical',
        diameter: 0.6,
        height: 1.8,
        fillRatio: 0.75,
      });

      expect(result.totalVolumeLiters).toBeCloseTo(509, 0);
      expect(result.workingVolumeLiters).toBeCloseTo(382, 0);
    });

    it('should calculate industrial fermentation tank (50000L)', () => {
      // Industrial: D=3m, H=7m
      const result = reactor({
        shape: 'cylindrical',
        diameter: 3,
        height: 7,
        fillRatio: 0.8,
      });

      expect(result.totalVolumeLiters).toBeCloseTo(49480, -1);
      expect(result.workingVolumeLiters).toBeCloseTo(39584, -1);
    });

    it('should calculate spherical storage tank', () => {
      // Spherical tank: D=4m
      const result = reactor({
        shape: 'spherical',
        diameter: 4,
        fillRatio: 0.85,
      });

      // V = (4/3)π×2³ = 33.51 m³ = 33510 L
      expect(result.totalVolumeLiters).toBeCloseTo(33510, -1);
    });
  });

  describe('comparison cylindrical vs spherical', () => {
    it('should show spherical has better volume/surface ratio', () => {
      const cylindrical = reactor({
        shape: 'cylindrical',
        diameter: 2,
        height: 2,
        fillRatio: 1.0,
      });

      const spherical = reactor({
        shape: 'spherical',
        diameter: 2,
        fillRatio: 1.0,
      });

      // Sphere has optimal V/S ratio (should be equal or better)
      // For this specific case they are equal
      expect(spherical.volumeToSurfaceRatio).toBeGreaterThanOrEqual(cylindrical.volumeToSurfaceRatio);
    });
  });
});
