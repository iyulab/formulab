import { describe, it, expect } from 'vitest';
import { spring } from './spring.js';

describe('spring', () => {
  describe('spring rate calculation', () => {
    it('should calculate spring rate for music wire', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 15,
        activeCoils: 10,
        material: 'musicWire',
      });

      expect(result.springRate).toBeGreaterThan(0);
      expect(result.shearModulus).toBe(79300);
    });

    it('should increase rate with thicker wire', () => {
      const thin = spring({
        wireDiameter: 1,
        meanCoilDiameter: 15,
        activeCoils: 10,
        material: 'musicWire',
      });

      const thick = spring({
        wireDiameter: 3,
        meanCoilDiameter: 15,
        activeCoils: 10,
        material: 'musicWire',
      });

      // Rate scales with d^4
      expect(thick.springRate).toBeGreaterThan(thin.springRate * 50);
    });

    it('should decrease rate with larger coil diameter', () => {
      const small = spring({
        wireDiameter: 2,
        meanCoilDiameter: 10,
        activeCoils: 10,
        material: 'musicWire',
      });

      const large = spring({
        wireDiameter: 2,
        meanCoilDiameter: 20,
        activeCoils: 10,
        material: 'musicWire',
      });

      expect(large.springRate).toBeLessThan(small.springRate);
    });

    it('should decrease rate with more coils', () => {
      const few = spring({
        wireDiameter: 2,
        meanCoilDiameter: 15,
        activeCoils: 5,
        material: 'musicWire',
      });

      const many = spring({
        wireDiameter: 2,
        meanCoilDiameter: 15,
        activeCoils: 20,
        material: 'musicWire',
      });

      expect(many.springRate).toBeLessThan(few.springRate);
    });
  });

  describe('spring index', () => {
    it('should calculate spring index (C = D/d)', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 16,
        activeCoils: 10,
        material: 'musicWire',
      });

      expect(result.springIndex).toBe(8); // 16/2 = 8
    });
  });

  describe('Wahl correction factor', () => {
    it('should calculate stress correction factor', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 16,
        activeCoils: 10,
        material: 'musicWire',
      });

      // Ks should be > 1
      expect(result.stressCorrectionFactor).toBeGreaterThan(1);
    });

    it('should have higher correction for lower spring index', () => {
      const lowC = spring({
        wireDiameter: 2,
        meanCoilDiameter: 10, // C = 5
        activeCoils: 10,
        material: 'musicWire',
      });

      const highC = spring({
        wireDiameter: 2,
        meanCoilDiameter: 24, // C = 12
        activeCoils: 10,
        material: 'musicWire',
      });

      expect(lowC.stressCorrectionFactor).toBeGreaterThan(highC.stressCorrectionFactor);
    });
  });

  describe('shear stress calculation', () => {
    it('should calculate shear stress when force is provided', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 16,
        activeCoils: 10,
        material: 'musicWire',
        force: 50, // N
      });

      expect(result.shearStress).toBeGreaterThan(0);
    });

    it('should not include shear stress when no force', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 16,
        activeCoils: 10,
        material: 'musicWire',
      });

      expect(result.shearStress).toBeUndefined();
    });
  });

  describe('material types', () => {
    it('should use stainless302 shear modulus', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 15,
        activeCoils: 10,
        material: 'stainless302',
      });

      expect(result.shearModulus).toBe(69000);
    });

    it('should use phosphorBronze shear modulus', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 15,
        activeCoils: 10,
        material: 'phosphorBronze',
      });

      expect(result.shearModulus).toBe(41000);
    });

    it('should use berylliumCopper shear modulus', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 15,
        activeCoils: 10,
        material: 'berylliumCopper',
      });

      expect(result.shearModulus).toBe(48000);
    });

    it('should default to music wire when material not specified', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 15,
        activeCoils: 10,
      });

      expect(result.shearModulus).toBe(79300);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for invalid wire diameter', () => {
      const result = spring({
        wireDiameter: 0,
        meanCoilDiameter: 15,
        activeCoils: 10,
      });

      expect(result.springRate).toBe(0);
    });

    it('should return zeros for invalid coil diameter', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 0,
        activeCoils: 10,
      });

      expect(result.springRate).toBe(0);
    });

    it('should return zeros for invalid coil count', () => {
      const result = spring({
        wireDiameter: 2,
        meanCoilDiameter: 15,
        activeCoils: 0,
      });

      expect(result.springRate).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate compression spring for mechanism', () => {
      const result = spring({
        wireDiameter: 1.5,
        meanCoilDiameter: 12,
        activeCoils: 8,
        material: 'musicWire',
        force: 20,
      });

      expect(result.springRate).toBeGreaterThan(0);
      expect(result.shearStress).toBeGreaterThan(0);
      expect(result.springIndex).toBe(8);
    });

    it('should calculate valve spring', () => {
      const result = spring({
        wireDiameter: 4,
        meanCoilDiameter: 28,
        activeCoils: 6,
        material: 'musicWire',
        force: 500,
      });

      expect(result.springRate).toBeGreaterThan(0);
      expect(result.shearStress).toBeLessThan(800); // Below typical yield
    });
  });
});
