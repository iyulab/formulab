import { describe, it, expect } from 'vitest';
import { fallClearance } from './fallClearance.js';

describe('fallClearance', () => {
  describe('basic calculation', () => {
    it('should calculate total fall distance correctly', () => {
      const result = fallClearance({
        lanyardLength: 1.8,      // 6ft lanyard
        decelerationDistance: 1.07, // 3.5ft deceleration
        harnessStretch: 0.3,     // harness stretch
        workerHeight: 1.8,       // worker height (D-ring to feet)
        safetyFactor: 0.9,       // safety buffer
        anchorHeight: 0,         // anchor at foot level
      });

      // Total Fall Distance = lanyard + deceleration + harness + workerHeight
      // (safetyFactor is separate - not part of physical fall distance)
      // = 1.8 + 1.07 + 0.3 + 1.8 = 4.97m
      expect(result.totalFallDistance).toBeCloseTo(4.97, 2);
    });

    it('should calculate minimum height correctly', () => {
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 2,
      });

      // minimumHeight = totalFallDistance + safetyFactor - anchorHeight
      // = 4.97 + 0.9 - 2 = 3.87m
      expect(result.minimumHeight).toBeCloseTo(3.87, 2);
    });

    it('should calculate free space required', () => {
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 3,
        rescueClearance: 0.9,
      });

      // freeSpaceRequired = totalFallDistance + safetyFactor + rescueClearance
      // = 4.97 + 0.9 + 0.9 = 6.77m
      expect(result.freeSpaceRequired).toBeCloseTo(6.77, 2);
      expect(result.rescueClearance).toBe(0.9);
    });
  });

  describe('isAdequate determination', () => {
    it('should return true when clearance above obstacle is positive', () => {
      // High anchor gives adequate clearance
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 8, // High overhead anchor
        obstacleHeight: 0,
      });

      // workerLowestPoint = anchorHeight - (totalFallDistance + safetyFactor)
      // = 8 - (4.97 + 0.9) = 2.13m
      // clearanceAboveObstacle = 2.13 - 0 = 2.13m (positive = safe)
      expect(result.clearanceAboveObstacle).toBeCloseTo(2.13, 1);
      expect(result.isAdequate).toBe(true);
    });

    it('should return false when anchor is at foot level', () => {
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 0,
      });

      expect(result.isAdequate).toBe(false);
      expect(result.warnings.some(w => w.includes('Anchor at or below foot level'))).toBe(true);
    });

    it('should return false when anchor is below foot level', () => {
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: -0.5,
      });

      expect(result.isAdequate).toBe(false);
    });

    it('should return false when worker contacts obstacle', () => {
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 3,
        obstacleHeight: 0, // Ground level
      });

      // workerLowestPoint = 3 - 5.87 = -2.87m (below ground)
      // clearanceAboveObstacle = -2.87 - 0 = -2.87m (negative = contact)
      expect(result.clearanceAboveObstacle).toBeLessThan(0);
      expect(result.isAdequate).toBe(false);
      expect(result.warnings.some(w => w.includes('Insufficient clearance'))).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate typical rooftop scenario with adequate anchor', () => {
      // Worker on rooftop with high overhead anchor point
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 8,
        obstacleHeight: 0,
      });

      expect(result.totalFallDistance).toBeCloseTo(4.97, 2);
      expect(result.isAdequate).toBe(true);
    });

    it('should calculate steel erection scenario', () => {
      // Worker on steel beam with foot-level anchor - dangerous
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 0,
      });

      expect(result.totalFallDistance).toBeCloseTo(4.97, 2);
      expect(result.minimumHeight).toBeCloseTo(5.87, 2);
      expect(result.isAdequate).toBe(false);
    });

    it('should calculate scenario with elevated obstacle', () => {
      // Platform with equipment below
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 10,
        obstacleHeight: 3, // Equipment at 3m height
      });

      // workerLowestPoint = 10 - 5.87 = 4.13m
      // clearanceAboveObstacle = 4.13 - 3 = 1.13m
      expect(result.clearanceAboveObstacle).toBeCloseTo(1.13, 1);
      expect(result.isAdequate).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle zero lanyard length (SRL)', () => {
      const result = fallClearance({
        lanyardLength: 0,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 0,
      });

      // Total = 0 + 1.07 + 0.3 + 1.8 = 3.17m
      expect(result.totalFallDistance).toBeCloseTo(3.17, 2);
    });

    it('should handle zero safety factor', () => {
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0,
        anchorHeight: 0,
      });

      // Total = 1.8 + 1.07 + 0.3 + 1.8 = 4.97m
      expect(result.totalFallDistance).toBeCloseTo(4.97, 2);
    });
  });

  describe('warnings generation', () => {
    it('should warn about long lanyard', () => {
      const result = fallClearance({
        lanyardLength: 2.0, // Exceeds standard 1.8m
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 10,
      });

      expect(result.warnings.some(w => w.includes('Lanyard exceeds'))).toBe(true);
    });

    it('should warn about excessive deceleration distance', () => {
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.2, // Exceeds OSHA max
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 10,
      });

      expect(result.warnings.some(w => w.includes('OSHA maximum'))).toBe(true);
    });

    it('should warn about low rescue clearance', () => {
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 10,
        rescueClearance: 0.5, // Below ANSI Z359.4 minimum
      });

      expect(result.warnings.some(w => w.includes('Rescue clearance below'))).toBe(true);
    });

    it('should warn about marginal clearance', () => {
      const result = fallClearance({
        lanyardLength: 1.8,
        decelerationDistance: 1.07,
        harnessStretch: 0.3,
        workerHeight: 1.8,
        safetyFactor: 0.9,
        anchorHeight: 6, // Just barely adequate
        obstacleHeight: 0,
      });

      // clearanceAboveObstacle = 6 - 5.87 = 0.13m (marginal)
      expect(result.isAdequate).toBe(true);
      expect(result.warnings.some(w => w.includes('increasing anchor height'))).toBe(true);
    });
  });
});
