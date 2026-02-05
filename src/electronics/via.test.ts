import { describe, it, expect } from 'vitest';
import { viaCurrent } from './via.js';

describe('viaCurrent', () => {
  describe('basic calculations', () => {
    it('should calculate current capacity', () => {
      const result = viaCurrent({
        holeDiameter: 0.3, // 0.3mm
        platingThickness: 25, // 25µm
        viaLength: 1.6, // 1.6mm (typical board thickness)
        tempRise: 10, // 10°C
      });

      expect(result).not.toBeNull();
      expect(result!.currentCapacity).toBeGreaterThan(0);
    });

    it('should calculate cross section area', () => {
      const result = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(result).not.toBeNull();
      // Area = π × [(0.15 + 0.025)² - 0.15²] = π × [0.030625 - 0.0225] = π × 0.008125 ≈ 0.0255 mm²
      expect(result!.crossSectionMm2).toBeCloseTo(0.0255, 3);
    });

    it('should calculate resistance', () => {
      const result = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(result).not.toBeNull();
      expect(result!.resistanceMOhm).toBeGreaterThan(0);
    });

    it('should calculate thermal resistance', () => {
      const result = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(result).not.toBeNull();
      expect(result!.thermalResistance).toBeGreaterThan(0);
    });

    it('should calculate power dissipation', () => {
      const result = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(result).not.toBeNull();
      expect(result!.powerDissipation).toBeGreaterThan(0);
    });
  });

  describe('parameter effects', () => {
    it('should increase current capacity with larger hole diameter', () => {
      const small = viaCurrent({
        holeDiameter: 0.2,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      const large = viaCurrent({
        holeDiameter: 0.5,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(large!.currentCapacity).toBeGreaterThan(small!.currentCapacity);
    });

    it('should increase current capacity with thicker plating', () => {
      const thin = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 18, // 18µm (Class 2)
        viaLength: 1.6,
        tempRise: 10,
      });

      const thick = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 35, // 35µm (Class 3)
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(thick!.currentCapacity).toBeGreaterThan(thin!.currentCapacity);
    });

    it('should increase current capacity with higher temp rise allowance', () => {
      const lowTemp = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      const highTemp = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 30,
      });

      expect(highTemp!.currentCapacity).toBeGreaterThan(lowTemp!.currentCapacity);
    });

    it('should increase resistance with longer via', () => {
      const short = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 0.8, // 4-layer board
        tempRise: 10,
      });

      const long = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 3.2, // Thick board
        tempRise: 10,
      });

      expect(long!.resistanceMOhm).toBeGreaterThan(short!.resistanceMOhm);
    });
  });

  describe('invalid inputs', () => {
    it('should return null for zero hole diameter', () => {
      const result = viaCurrent({
        holeDiameter: 0,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(result).toBeNull();
    });

    it('should return null for zero plating thickness', () => {
      const result = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 0,
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(result).toBeNull();
    });

    it('should return null for zero via length', () => {
      const result = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 0,
        tempRise: 10,
      });

      expect(result).toBeNull();
    });

    it('should return null for zero temp rise', () => {
      const result = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 0,
      });

      expect(result).toBeNull();
    });

    it('should return null for negative values', () => {
      const result = viaCurrent({
        holeDiameter: -0.3,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(result).toBeNull();
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate standard via (0.3mm / 1oz)', () => {
      const result = viaCurrent({
        holeDiameter: 0.3,
        platingThickness: 25, // ~1oz equivalent
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(result).not.toBeNull();
      // Typical: 0.5-1A capacity
      expect(result!.currentCapacity).toBeGreaterThan(0.3);
      expect(result!.currentCapacity).toBeLessThan(3);
    });

    it('should calculate microvia (0.1mm)', () => {
      const result = viaCurrent({
        holeDiameter: 0.1,
        platingThickness: 18,
        viaLength: 0.2, // Microvia spans 1 layer
        tempRise: 10,
      });

      expect(result).not.toBeNull();
      expect(result!.currentCapacity).toBeGreaterThan(0);
    });

    it('should calculate power via (0.5mm / 2oz)', () => {
      const result = viaCurrent({
        holeDiameter: 0.5,
        platingThickness: 35,
        viaLength: 1.6,
        tempRise: 20,
      });

      expect(result).not.toBeNull();
      expect(result!.currentCapacity).toBeGreaterThan(1);
    });

    it('should calculate HDI via array current sharing', () => {
      const single = viaCurrent({
        holeDiameter: 0.2,
        platingThickness: 25,
        viaLength: 1.6,
        tempRise: 10,
      });

      // 4 vias in parallel = 4× current capacity
      expect(single).not.toBeNull();
      const parallelCapacity = single!.currentCapacity * 4;
      expect(parallelCapacity).toBeGreaterThan(single!.currentCapacity);
    });

    it('should calculate thick board via (3.2mm)', () => {
      const result = viaCurrent({
        holeDiameter: 0.4,
        platingThickness: 30,
        viaLength: 3.2, // 20-layer board
        tempRise: 10,
      });

      expect(result).not.toBeNull();
      // Higher resistance due to longer via
      expect(result!.resistanceMOhm).toBeGreaterThan(1);
    });
  });

  describe('cross section calculation', () => {
    it('should calculate copper ring area correctly', () => {
      const result = viaCurrent({
        holeDiameter: 0.4, // 0.4mm = 0.2mm radius
        platingThickness: 50, // 50µm = 0.05mm
        viaLength: 1.6,
        tempRise: 10,
      });

      expect(result).not.toBeNull();
      // Inner radius = 0.2mm, Outer radius = 0.25mm
      // Area = π × (0.25² - 0.2²) = π × (0.0625 - 0.04) = π × 0.0225 ≈ 0.0707 mm²
      expect(result!.crossSectionMm2).toBeCloseTo(0.0707, 3);
    });
  });
});
