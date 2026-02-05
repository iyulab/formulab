import { describe, it, expect } from 'vitest';
import { smtTakt } from './smt-takt.js';

describe('smtTakt', () => {
  describe('placement time calculation', () => {
    it('should calculate placement time correctly', () => {
      const result = smtTakt({
        placementRate: 36000, // 36000 cph
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      // Placement time = (100 / 36000) × 3600 = 10 seconds
      expect(result.placementTimeSec).toBe(10);
    });

    it('should increase with more components', () => {
      const few = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      const many = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 500,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      expect(many.placementTimeSec).toBeGreaterThan(few.placementTimeSec);
    });
  });

  describe('total cycle time', () => {
    it('should include setup time', () => {
      const result = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      // Total = placement (10) + setup (5) = 15 seconds
      expect(result.totalCycleTimeSec).toBe(15);
    });

    it('should handle zero setup time', () => {
      const result = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 0,
        availableTimeMin: 480,
      });

      expect(result.totalCycleTimeSec).toBe(result.placementTimeSec);
    });
  });

  describe('boards per hour', () => {
    it('should calculate boards per hour correctly', () => {
      const result = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      // Boards per hour = 3600 / 15 = 240
      expect(result.boardsPerHour).toBe(240);
    });
  });

  describe('total boards per shift', () => {
    it('should calculate total boards for 8-hour shift', () => {
      const result = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480, // 8 hours
      });

      // Available time = 480 × 60 = 28800 seconds
      // Boards = floor(28800 / 15) × 1 = 1920
      expect(result.totalBoardsPerShift).toBe(1920);
    });

    it('should multiply by boards per panel', () => {
      const result = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 4,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      // Panels = floor(28800 / 15) = 1920
      // Boards = 1920 × 4 = 7680
      expect(result.totalBoardsPerShift).toBe(7680);
    });
  });

  describe('line utilization', () => {
    it('should calculate utilization percentage', () => {
      const result = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      // Utilization = (placement / total) × 100 = (10 / 15) × 100 = 66.67%
      expect(result.lineUtilization).toBeCloseTo(66.67, 1);
    });

    it('should be 100% when no setup time', () => {
      const result = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 0,
        availableTimeMin: 480,
      });

      expect(result.lineUtilization).toBe(100);
    });

    it('should decrease with longer setup time', () => {
      const short = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      const long = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 20,
        availableTimeMin: 480,
      });

      expect(long.lineUtilization).toBeLessThan(short.lineUtilization);
    });
  });

  describe('edge cases', () => {
    it('should handle zero components per board', () => {
      const result = smtTakt({
        placementRate: 36000,
        componentsPerBoard: 0,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      expect(result.placementTimeSec).toBe(0);
      expect(result.boardsPerHour).toBe(0);
      expect(result.lineUtilization).toBe(0);
    });

    it('should handle zero placement rate', () => {
      const result = smtTakt({
        placementRate: 0,
        componentsPerBoard: 100,
        boardsPerPanel: 1,
        setupTimeSec: 5,
        availableTimeMin: 480,
      });

      expect(result.placementTimeSec).toBe(0);
      expect(result.boardsPerHour).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate high-speed SMT line', () => {
      const result = smtTakt({
        placementRate: 80000, // High-speed machine
        componentsPerBoard: 200,
        boardsPerPanel: 2,
        setupTimeSec: 8,
        availableTimeMin: 480,
      });

      expect(result.boardsPerHour).toBeGreaterThan(200);
    });

    it('should calculate mid-volume production', () => {
      const result = smtTakt({
        placementRate: 40000,
        componentsPerBoard: 350,
        boardsPerPanel: 1,
        setupTimeSec: 10,
        availableTimeMin: 480,
      });

      expect(result.totalBoardsPerShift).toBeGreaterThan(500);
    });

    it('should calculate prototype production', () => {
      const result = smtTakt({
        placementRate: 15000, // Manual/semi-auto
        componentsPerBoard: 50,
        boardsPerPanel: 1,
        setupTimeSec: 30, // Longer setup for small runs
        availableTimeMin: 480,
      });

      expect(result.lineUtilization).toBeLessThan(50);
    });

    it('should calculate complex board assembly', () => {
      const result = smtTakt({
        placementRate: 50000,
        componentsPerBoard: 1500, // Complex board
        boardsPerPanel: 1,
        setupTimeSec: 15,
        availableTimeMin: 480,
      });

      expect(result.placementTimeSec).toBeGreaterThan(100);
    });
  });
});
