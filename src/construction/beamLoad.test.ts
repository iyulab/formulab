import { describe, it, expect } from 'vitest';
import { beamLoad } from './beamLoad.js';

describe('beamLoad', () => {
  describe('simple beam with uniform load', () => {
    it('should calculate max moment correctly', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'simple',
        span: 6, // 6m
        uniformLoad: 10, // 10 kN/m
      });

      expect(result).not.toBeNull();
      // M_max = wL²/8 = 10 × 36 / 8 = 45 kN·m
      expect(result!.maxMoment).toBe(45);
    });

    it('should calculate max shear correctly', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'simple',
        span: 6,
        uniformLoad: 10,
      });

      expect(result).not.toBeNull();
      // V_max = wL/2 = 10 × 6 / 2 = 30 kN
      expect(result!.maxShear).toBe(30);
    });

    it('should calculate reactions correctly', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'simple',
        span: 6,
        uniformLoad: 10,
      });

      expect(result).not.toBeNull();
      // R_L = R_R = wL/2 = 30 kN
      expect(result!.reactionLeft).toBe(30);
      expect(result!.reactionRight).toBe(30);
    });

    it('should return deflection coefficient', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'simple',
        span: 6,
        uniformLoad: 10,
      });

      expect(result).not.toBeNull();
      // Coefficient = 5/384
      expect(result!.maxDeflectionCoeff).toBeCloseTo(5 / 384, 6);
    });
  });

  describe('simple beam with concentrated load', () => {
    it('should calculate max moment at midspan', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'simple',
        span: 8,
        pointLoad: 20, // 20 kN
        pointPosition: 4, // midspan
      });

      expect(result).not.toBeNull();
      // M_max = P×a×b/L = 20 × 4 × 4 / 8 = 40 kN·m
      expect(result!.maxMoment).toBe(40);
    });

    it('should calculate reactions for off-center load', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'simple',
        span: 10,
        pointLoad: 50,
        pointPosition: 3, // 3m from left
      });

      expect(result).not.toBeNull();
      // R_L = P×b/L = 50 × 7 / 10 = 35 kN
      // R_R = P×a/L = 50 × 3 / 10 = 15 kN
      expect(result!.reactionLeft).toBe(35);
      expect(result!.reactionRight).toBe(15);
    });

    it('should calculate max shear as larger reaction', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'simple',
        span: 10,
        pointLoad: 50,
        pointPosition: 3,
      });

      expect(result).not.toBeNull();
      expect(result!.maxShear).toBe(35); // max(35, 15)
    });

    it('should include moment at point of application', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'simple',
        span: 8,
        pointLoad: 20,
        pointPosition: 4,
      });

      expect(result).not.toBeNull();
      expect(result!.momentAtPoint).toBe(40);
    });
  });

  describe('simple beam with combined load', () => {
    it('should combine uniform and point load effects', () => {
      const result = beamLoad({
        loadType: 'combined',
        support: 'simple',
        span: 6,
        uniformLoad: 10,
        pointLoad: 30,
        pointPosition: 3, // midspan
      });

      expect(result).not.toBeNull();
      // Uniform: M = 10×36/8 = 45
      // Point: M = 30×3×3/6 = 45
      // Total M = 90
      expect(result!.maxMoment).toBe(90);
    });

    it('should calculate combined reactions', () => {
      const result = beamLoad({
        loadType: 'combined',
        support: 'simple',
        span: 6,
        uniformLoad: 10,
        pointLoad: 30,
        pointPosition: 3,
      });

      expect(result).not.toBeNull();
      // Uniform: R = 30 each
      // Point: R = 15 each (midspan)
      // Total: 45 each
      expect(result!.reactionLeft).toBe(45);
      expect(result!.reactionRight).toBe(45);
    });
  });

  describe('cantilever beam with uniform load', () => {
    it('should calculate max moment at fixed end', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'cantilever',
        span: 4,
        uniformLoad: 15,
      });

      expect(result).not.toBeNull();
      // M_max = wL²/2 = 15 × 16 / 2 = 120 kN·m
      expect(result!.maxMoment).toBe(120);
    });

    it('should calculate max shear as total load', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'cantilever',
        span: 4,
        uniformLoad: 15,
      });

      expect(result).not.toBeNull();
      // V_max = wL = 15 × 4 = 60 kN
      expect(result!.maxShear).toBe(60);
    });

    it('should have reaction only at fixed end', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'cantilever',
        span: 4,
        uniformLoad: 15,
      });

      expect(result).not.toBeNull();
      expect(result!.reactionLeft).toBe(60);
      expect(result!.reactionRight).toBe(0);
    });
  });

  describe('cantilever beam with concentrated load', () => {
    it('should calculate moment based on load position', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'cantilever',
        span: 5,
        pointLoad: 25,
        pointPosition: 3, // 3m from fixed end
      });

      expect(result).not.toBeNull();
      // M = P×a = 25 × 3 = 75 kN·m
      expect(result!.maxMoment).toBe(75);
    });

    it('should have shear equal to point load', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'cantilever',
        span: 5,
        pointLoad: 25,
        pointPosition: 3,
      });

      expect(result).not.toBeNull();
      expect(result!.maxShear).toBe(25);
    });
  });

  describe('fixed-fixed beam with uniform load', () => {
    it('should calculate max moment at supports', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'fixed',
        span: 6,
        uniformLoad: 12,
      });

      expect(result).not.toBeNull();
      // M_max = wL²/12 = 12 × 36 / 12 = 36 kN·m
      expect(result!.maxMoment).toBe(36);
    });

    it('should have smaller deflection coefficient than simple beam', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'fixed',
        span: 6,
        uniformLoad: 12,
      });

      expect(result).not.toBeNull();
      // Coefficient = 1/384 (vs 5/384 for simple)
      expect(result!.maxDeflectionCoeff).toBeCloseTo(1 / 384, 6);
    });
  });

  describe('fixed-fixed beam with concentrated load', () => {
    it('should calculate max moment at supports', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'fixed',
        span: 8,
        pointLoad: 40,
        pointPosition: 4, // midspan
      });

      expect(result).not.toBeNull();
      // M_max = PL/8 = 40 × 8 / 8 = 40 kN·m
      expect(result!.maxMoment).toBe(40);
    });

    it('should split reactions equally for center load', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'fixed',
        span: 8,
        pointLoad: 40,
        pointPosition: 4,
      });

      expect(result).not.toBeNull();
      expect(result!.reactionLeft).toBe(20);
      expect(result!.reactionRight).toBe(20);
    });
  });

  describe('error handling', () => {
    it('should return null for zero span', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'simple',
        span: 0,
        uniformLoad: 10,
      });

      expect(result).toBeNull();
    });

    it('should return null for negative span', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'simple',
        span: -5,
        uniformLoad: 10,
      });

      expect(result).toBeNull();
    });

    it('should return null for uniform load without uniformLoad value', () => {
      const result = beamLoad({
        loadType: 'uniform',
        support: 'simple',
        span: 6,
      });

      expect(result).toBeNull();
    });

    it('should return null for concentrated load without pointLoad value', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'simple',
        span: 6,
      });

      expect(result).toBeNull();
    });

    it('should return null for combined load without both values', () => {
      const result = beamLoad({
        loadType: 'combined',
        support: 'simple',
        span: 6,
        uniformLoad: 10,
      });

      expect(result).toBeNull();
    });
  });

  describe('default point position', () => {
    it('should default to midspan when not specified', () => {
      const result = beamLoad({
        loadType: 'concentrated',
        support: 'simple',
        span: 10,
        pointLoad: 50,
      });

      expect(result).not.toBeNull();
      // At midspan: a=5, b=5
      // M = 50×5×5/10 = 125
      expect(result!.maxMoment).toBe(125);
    });
  });
});
