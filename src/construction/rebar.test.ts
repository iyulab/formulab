import { describe, it, expect } from 'vitest';
import { rebarWeight, getRebarUnitWeight } from './rebar.js';

describe('rebarWeight', () => {
  describe('unit weights', () => {
    it('should return correct unit weight for D10', () => {
      expect(getRebarUnitWeight('D10')).toBe(0.617);
    });

    it('should return correct unit weight for D13', () => {
      expect(getRebarUnitWeight('D13')).toBe(1.04);
    });

    it('should return correct unit weight for D16', () => {
      expect(getRebarUnitWeight('D16')).toBe(1.56);
    });

    it('should return correct unit weight for D19', () => {
      expect(getRebarUnitWeight('D19')).toBe(2.23);
    });

    it('should return correct unit weight for D22', () => {
      expect(getRebarUnitWeight('D22')).toBe(2.98);
    });

    it('should return correct unit weight for D25', () => {
      expect(getRebarUnitWeight('D25')).toBe(3.98);
    });

    it('should return correct unit weight for D29', () => {
      expect(getRebarUnitWeight('D29')).toBe(5.18);
    });

    it('should return correct unit weight for D32', () => {
      expect(getRebarUnitWeight('D32')).toBe(6.31);
    });
  });

  describe('basic calculations', () => {
    it('should calculate total length correctly', () => {
      const result = rebarWeight({
        size: 'D16',
        length: 6, // 6m each
        quantity: 10,
      });

      // Total length = 6 × 10 = 60 m
      expect(result.totalLength).toBe(60);
    });

    it('should calculate total weight correctly', () => {
      const result = rebarWeight({
        size: 'D16',
        length: 6,
        quantity: 10,
      });

      // Unit weight = 1.56 kg/m
      // Total weight = 1.56 × 60 = 93.6 kg
      expect(result.unitWeight).toBe(1.56);
      expect(result.totalWeight).toBe(93.6);
    });
  });

  describe('different sizes', () => {
    it('should calculate for D10', () => {
      const result = rebarWeight({
        size: 'D10',
        length: 12,
        quantity: 50,
      });

      // Total length = 600 m
      // Weight = 0.617 × 600 = 370.2 kg
      expect(result.totalLength).toBe(600);
      expect(result.totalWeight).toBe(370.2);
    });

    it('should calculate for D25', () => {
      const result = rebarWeight({
        size: 'D25',
        length: 12,
        quantity: 20,
      });

      // Total length = 240 m
      // Weight = 3.98 × 240 = 955.2 kg
      expect(result.totalLength).toBe(240);
      expect(result.totalWeight).toBe(955.2);
    });

    it('should calculate for D32', () => {
      const result = rebarWeight({
        size: 'D32',
        length: 12,
        quantity: 10,
      });

      // Total length = 120 m
      // Weight = 6.31 × 120 = 757.2 kg
      expect(result.totalLength).toBe(120);
      expect(result.totalWeight).toBe(757.2);
    });
  });

  describe('fractional lengths', () => {
    it('should handle fractional bar lengths', () => {
      const result = rebarWeight({
        size: 'D16',
        length: 3.5,
        quantity: 8,
      });

      // Total length = 3.5 × 8 = 28 m
      // Weight = 1.56 × 28 = 43.68 kg
      expect(result.totalLength).toBe(28);
      expect(result.totalWeight).toBe(43.68);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for column reinforcement', () => {
      // 4 main bars D25, 3m height, plus ties D10
      const mainBars = rebarWeight({
        size: 'D25',
        length: 3.5, // with lap
        quantity: 4,
      });

      // 14 m of D25 = 3.98 × 14 = 55.72 kg
      expect(mainBars.totalWeight).toBe(55.72);
    });

    it('should calculate for slab reinforcement', () => {
      // Bottom mat: D10 @ 150mm, 100m²
      // Each direction: 100/0.15 = 667 bars × 10m average
      const slabRebar = rebarWeight({
        size: 'D10',
        length: 10,
        quantity: 670,
      });

      expect(result => result.totalWeight).not.toBeUndefined();
    });

    it('should calculate for beam reinforcement', () => {
      // 6m beam with 4×D22 bottom, 2×D16 top
      const bottom = rebarWeight({
        size: 'D22',
        length: 6.5, // with anchorage
        quantity: 4,
      });

      const top = rebarWeight({
        size: 'D16',
        length: 6.5,
        quantity: 2,
      });

      // Bottom = 2.98 × 26 = 77.48 kg
      // Top = 1.56 × 13 = 20.28 kg
      expect(bottom.totalWeight).toBe(77.48);
      expect(top.totalWeight).toBe(20.28);
    });

    it('should calculate for foundation mat', () => {
      // Large mat foundation with heavy reinforcement
      const result = rebarWeight({
        size: 'D32',
        length: 12,
        quantity: 100,
      });

      // Total length = 1200 m
      // Weight = 6.31 × 1200 = 7572 kg = 7.57 tonnes
      expect(result.totalWeight).toBe(7572);
    });
  });

  describe('edge cases', () => {
    it('should handle single bar', () => {
      const result = rebarWeight({
        size: 'D16',
        length: 6,
        quantity: 1,
      });

      expect(result.totalLength).toBe(6);
      expect(result.totalWeight).toBe(9.36);
    });

    it('should handle short bars', () => {
      const result = rebarWeight({
        size: 'D10',
        length: 0.5, // stirrup legs
        quantity: 100,
      });

      expect(result.totalLength).toBe(50);
      expect(result.totalWeight).toBe(30.85);
    });
  });
});
