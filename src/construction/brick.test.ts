import { describe, it, expect } from 'vitest';
import { brick, BRICK_SIZES } from './brick.js';

describe('brick', () => {
  describe('bricks per square meter', () => {
    it('should calculate for modular brick with 10mm mortar', () => {
      const result = brick({
        wallArea: 1,
        brickSize: 'modular',
        mortarThickness: 10,
        wasteFactor: 0,
      });

      // Brick: 194×57, mortar: 10
      // Bricks/m² = 1,000,000 / ((194+10) × (57+10))
      //           = 1,000,000 / (204 × 67) = 73.2
      expect(result.bricksPerSqMeter).toBeCloseTo(73.2, 0);
    });

    it('should calculate for standard brick with 10mm mortar', () => {
      const result = brick({
        wallArea: 1,
        brickSize: 'standard',
        mortarThickness: 10,
        wasteFactor: 0,
      });

      // Brick: 203×57
      // Bricks/m² = 1,000,000 / ((203+10) × (57+10)) = 70.1
      expect(result.bricksPerSqMeter).toBeCloseTo(70.1, 0);
    });

    it('should calculate for queen brick', () => {
      const result = brick({
        wallArea: 1,
        brickSize: 'queen',
        mortarThickness: 10,
        wasteFactor: 0,
      });

      // Brick: 203×70
      // Bricks/m² = 1,000,000 / ((203+10) × (70+10)) = 58.5
      expect(result.bricksPerSqMeter).toBeCloseTo(58.5, 0);
    });

    it('should calculate for king brick', () => {
      const result = brick({
        wallArea: 1,
        brickSize: 'king',
        mortarThickness: 10,
        wasteFactor: 0,
      });

      // Brick: 244×70
      // Bricks/m² = 1,000,000 / ((244+10) × (70+10)) = 49.2
      expect(result.bricksPerSqMeter).toBeCloseTo(49.2, 0);
    });
  });

  describe('total bricks calculation', () => {
    it('should multiply by wall area', () => {
      const result = brick({
        wallArea: 50, // 50 m²
        brickSize: 'standard',
        mortarThickness: 10,
        wasteFactor: 0,
      });

      // Bricks per m² = 1,000,000 / (213 × 67) = 70.07
      // Bricks = 70.07 × 50 = 3503.5 → ceil = 3504
      expect(result.bricksWithoutWaste).toBeGreaterThan(3500);
      expect(result.bricksWithoutWaste).toBeLessThan(3510);
    });
  });

  describe('waste factor', () => {
    it('should add waste percentage', () => {
      const result = brick({
        wallArea: 100,
        brickSize: 'standard',
        mortarThickness: 10,
        wasteFactor: 5, // 5%
      });

      // Without waste ≈ 7007
      // With 5% waste = 7007 × 1.05 ≈ 7357
      expect(result.totalBricks).toBeGreaterThan(7350);
      expect(result.totalBricks).toBeLessThan(7370);
    });

    it('should calculate wasted bricks', () => {
      const result = brick({
        wallArea: 100,
        brickSize: 'standard',
        mortarThickness: 10,
        wasteFactor: 10, // 10%
      });

      // Wasted bricks should be approximately 10% of without waste
      const expectedWaste = result.bricksWithoutWaste * 0.1;
      expect(result.wastedBricks).toBeCloseTo(expectedWaste, -1);
    });

    it('should handle zero waste factor', () => {
      const result = brick({
        wallArea: 50,
        brickSize: 'standard',
        mortarThickness: 10,
        wasteFactor: 0,
      });

      expect(result.totalBricks).toBe(result.bricksWithoutWaste);
      expect(result.wastedBricks).toBe(0);
    });
  });

  describe('custom brick size', () => {
    it('should use custom dimensions', () => {
      const result = brick({
        wallArea: 1,
        brickSize: 'custom',
        customLength: 230,
        customHeight: 76,
        mortarThickness: 10,
        wasteFactor: 0,
      });

      // Bricks/m² = 1,000,000 / ((230+10) × (76+10)) = 48.4
      expect(result.bricksPerSqMeter).toBeCloseTo(48.4, 0);
    });

    it('should default custom dimensions when not provided', () => {
      const result = brick({
        wallArea: 1,
        brickSize: 'custom',
        mortarThickness: 10,
        wasteFactor: 0,
      });

      // Default: 200×60
      // Bricks/m² = 1,000,000 / (210 × 70) = 68
      expect(result.bricksPerSqMeter).toBeCloseTo(68, 0);
    });
  });

  describe('mortar thickness variations', () => {
    it('should calculate with thin mortar (6mm)', () => {
      const result = brick({
        wallArea: 1,
        brickSize: 'standard',
        mortarThickness: 6,
        wasteFactor: 0,
      });

      // Bricks/m² = 1,000,000 / ((203+6) × (57+6)) = 75.9
      expect(result.bricksPerSqMeter).toBeCloseTo(75.9, 0);
    });

    it('should calculate with thick mortar (15mm)', () => {
      const result = brick({
        wallArea: 1,
        brickSize: 'standard',
        mortarThickness: 15,
        wasteFactor: 0,
      });

      // Bricks/m² = 1,000,000 / ((203+15) × (57+15)) = 63.7
      expect(result.bricksPerSqMeter).toBeCloseTo(63.7, 0);
    });

    it('should show thicker mortar uses fewer bricks', () => {
      const thin = brick({
        wallArea: 1,
        brickSize: 'standard',
        mortarThickness: 6,
        wasteFactor: 0,
      });

      const thick = brick({
        wallArea: 1,
        brickSize: 'standard',
        mortarThickness: 15,
        wasteFactor: 0,
      });

      expect(thick.bricksPerSqMeter).toBeLessThan(thin.bricksPerSqMeter);
    });
  });

  describe('BRICK_SIZES constants', () => {
    it('should have correct modular dimensions', () => {
      expect(BRICK_SIZES.modular.length).toBe(194);
      expect(BRICK_SIZES.modular.height).toBe(57);
    });

    it('should have correct standard dimensions', () => {
      expect(BRICK_SIZES.standard.length).toBe(203);
      expect(BRICK_SIZES.standard.height).toBe(57);
    });

    it('should have correct queen dimensions', () => {
      expect(BRICK_SIZES.queen.length).toBe(203);
      expect(BRICK_SIZES.queen.height).toBe(70);
    });

    it('should have correct king dimensions', () => {
      expect(BRICK_SIZES.king.length).toBe(244);
      expect(BRICK_SIZES.king.height).toBe(70);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for single story house exterior', () => {
      // Typical perimeter: 40m, height: 2.7m, minus openings: 20%
      const wallArea = 40 * 2.7 * 0.8; // 86.4 m²
      const result = brick({
        wallArea,
        brickSize: 'standard',
        mortarThickness: 10,
        wasteFactor: 7,
      });

      expect(result.totalBricks).toBeGreaterThan(6000);
    });

    it('should calculate for garden wall', () => {
      const result = brick({
        wallArea: 15, // 10m × 1.5m high
        brickSize: 'modular',
        mortarThickness: 10,
        wasteFactor: 5,
      });

      expect(result.totalBricks).toBeGreaterThan(1000);
    });

    it('should calculate for small repairs', () => {
      const result = brick({
        wallArea: 2, // 2 m² patch
        brickSize: 'standard',
        mortarThickness: 10,
        wasteFactor: 10, // Higher waste for small jobs
      });

      expect(result.totalBricks).toBeLessThan(200);
    });

    it('should calculate for commercial building facade', () => {
      const result = brick({
        wallArea: 500,
        brickSize: 'king',
        mortarThickness: 12,
        wasteFactor: 5,
      });

      // King brick: ~49/m² × 500 × 1.05 ≈ 25,725
      expect(result.totalBricks).toBeGreaterThan(25000);
    });
  });
});
