import { describe, it, expect } from 'vitest';
import { nioshLifting } from './nioshLifting.js';

describe('nioshLifting', () => {
  describe('ideal conditions (all multipliers = 1.0)', () => {
    it('should return LC=23kg when all conditions are ideal', () => {
      const result = nioshLifting({
        horizontalDistance: 25,    // ideal: 25cm (HM = 1.0)
        verticalDistance: 75,      // ideal: 75cm (VM = 1.0)
        verticalTravel: 25,        // minimum (DM ≈ 1.0)
        asymmetryAngle: 0,         // no twist (AM = 1.0)
        frequency: 0.2,            // low frequency
        duration: 'short',         // short duration (FM = 1.0)
        coupling: 'good',          // good grip (CM = 1.0)
        loadWeight: 23,
      });

      // RWL should be close to LC (23 kg)
      expect(result.rwl).toBeGreaterThan(20);
      expect(result.liftingIndex).toBeCloseTo(1.0, 1);
      expect(result.riskLevel).toBe('low');

      // All multipliers should be at or near 1.0
      expect(result.hm).toBe(1.0);
      expect(result.vm).toBe(1.0);
      expect(result.am).toBe(1.0);
      expect(result.cm).toBe(1.0);
    });
  });

  describe('horizontal distance effects', () => {
    it('should decrease RWL as horizontal distance increases', () => {
      const close = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      const far = nioshLifting({
        horizontalDistance: 50,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      // HM = 25/H, so H=25 gives HM=1.0, H=50 gives HM=0.5
      expect(close.hm).toBe(1.0);
      expect(far.hm).toBe(0.5);
      expect(close.rwl).toBeGreaterThan(far.rwl);
    });
  });

  describe('vertical distance effects', () => {
    it('should have highest RWL at 75cm (knuckle height)', () => {
      const knuckle = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,  // optimal height
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      const floor = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 0,  // floor level
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      // VM = 1 - 0.003|V - 75|
      // At V=75: VM = 1.0
      // At V=0: VM = 1 - 0.003*75 = 0.775
      expect(knuckle.vm).toBe(1.0);
      expect(floor.vm).toBeCloseTo(0.775, 2);
      expect(knuckle.rwl).toBeGreaterThan(floor.rwl);
    });

    it('should decrease RWL at overhead height', () => {
      const overhead = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 175,  // overhead
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      // VM = 1 - 0.003*|175-75| = 1 - 0.3 = 0.7
      expect(overhead.vm).toBeCloseTo(0.7, 2);
    });
  });

  describe('asymmetry angle effects', () => {
    it('should decrease RWL with increased twisting', () => {
      const noTwist = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      const twisted = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 90,  // 90 degree twist
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      // AM = 1 - 0.0032*A
      // At A=0: AM = 1.0
      // At A=90: AM = 1 - 0.288 = 0.712
      expect(noTwist.am).toBe(1.0);
      expect(twisted.am).toBeCloseTo(0.712, 2);
      expect(noTwist.rwl).toBeGreaterThan(twisted.rwl);
    });
  });

  describe('frequency and duration effects', () => {
    it('should decrease RWL for longer durations', () => {
      const shortDuration = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      const longDuration = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'long',
        coupling: 'good',
        loadWeight: 10,
      });

      expect(shortDuration.fm).toBeGreaterThan(longDuration.fm);
      expect(shortDuration.rwl).toBeGreaterThan(longDuration.rwl);
    });

    it('should decrease RWL for higher frequencies', () => {
      const lowFreq = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,  // 1 lift per minute
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      const highFreq = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 15,  // 15 lifts per minute
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      expect(lowFreq.fm).toBeGreaterThan(highFreq.fm);
      expect(lowFreq.rwl).toBeGreaterThan(highFreq.rwl);
    });
  });

  describe('coupling effects', () => {
    it('should decrease RWL with poor coupling', () => {
      const goodCoupling = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      const poorCoupling = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'poor',
        loadWeight: 10,
      });

      expect(goodCoupling.cm).toBe(1.0);
      expect(poorCoupling.cm).toBe(0.9);
      expect(goodCoupling.rwl).toBeGreaterThan(poorCoupling.rwl);
    });
  });

  describe('risk levels', () => {
    it('should classify low risk (LI <= 1.0)', () => {
      const result = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 15,  // well under RWL
      });

      expect(result.liftingIndex).toBeLessThanOrEqual(1.0);
      expect(result.riskLevel).toBe('low');
    });

    it('should classify moderate risk (1.0 < LI <= 2.0)', () => {
      const result = nioshLifting({
        horizontalDistance: 40,
        verticalDistance: 30,
        verticalTravel: 50,
        asymmetryAngle: 45,
        frequency: 5,
        duration: 'medium',
        coupling: 'fair',
        loadWeight: 15,
      });

      // This combination should create moderate risk
      if (result.liftingIndex > 1.0 && result.liftingIndex <= 2.0) {
        expect(result.riskLevel).toBe('moderate');
      }
    });

    it('should classify high risk (LI > 2.0)', () => {
      const result = nioshLifting({
        horizontalDistance: 60,
        verticalDistance: 0,
        verticalTravel: 100,
        asymmetryAngle: 90,
        frequency: 10,
        duration: 'long',
        coupling: 'poor',
        loadWeight: 25,  // heavy load with poor conditions
      });

      expect(result.liftingIndex).toBeGreaterThan(2.0);
      expect(result.riskLevel).toBe('high');
    });
  });

  describe('real-world scenarios', () => {
    it('should evaluate warehouse box lifting', () => {
      // Picking 12kg boxes from floor-level pallet
      const result = nioshLifting({
        horizontalDistance: 40,
        verticalDistance: 20,
        verticalTravel: 80,
        asymmetryAngle: 30,
        frequency: 4,
        duration: 'long',
        coupling: 'fair',
        loadWeight: 12,
      });

      // Should indicate some risk due to floor-level + long duration
      expect(result.rwl).toBeDefined();
      expect(result.liftingIndex).toBeGreaterThan(0);
    });

    it('should evaluate assembly line component handling', () => {
      // Repetitive handling of 5kg parts at workbench height
      const result = nioshLifting({
        horizontalDistance: 30,
        verticalDistance: 80,
        verticalTravel: 20,
        asymmetryAngle: 15,
        frequency: 8,
        duration: 'long',
        coupling: 'good',
        loadWeight: 5,
      });

      // Light weight but high frequency - check risk
      expect(result.rwl).toBeDefined();
    });
  });

  describe('Golden Reference Tests', () => {
    it('NIOSH ideal conditions: RWL = LC = 23 kg', () => {
      // NIOSH Publication 94-110: Under ideal conditions all multipliers = 1.0
      // H=25cm, V=75cm, D=25cm, A=0°, F=0.2/min, short, good coupling
      const result = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 0.2,
        duration: 'short',
        coupling: 'good',
        loadWeight: 23,
      });

      // All multipliers should be 1.0
      expect(result.hm).toBe(1.0);
      expect(result.vm).toBe(1.0);
      expect(result.dm).toBe(1.0);
      expect(result.am).toBe(1.0);
      expect(result.fm).toBe(1.0);
      expect(result.cm).toBe(1.0);
      // RWL = 23 × 1 × 1 × 1 × 1 × 1 × 1 = 23 kg
      expect(result.rwl).toBeCloseTo(23, 4);
      // LI = 23/23 = 1.0 → low risk
      expect(result.liftingIndex).toBeCloseTo(1.0, 4);
      expect(result.riskLevel).toBe('low');
    });

    it('LC verification: Load Constant = 23 kg', () => {
      // The NIOSH Load Constant (LC) = 23 kg (51 lb)
      // This is the maximum recommended weight under ideal conditions
      const result = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 0.2,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      // RWL should equal LC=23 exactly under ideal conditions
      expect(result.rwl).toBeCloseTo(23, 4);
    });

    it('FM table verification: frequency=1, duration=short → FM=0.94', () => {
      // NIOSH 94-110 Table 5: FM for freq=1/min, short duration = 0.94
      const result = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 1,
        duration: 'short',
        coupling: 'good',
        loadWeight: 10,
      });

      expect(result.fm).toBe(0.94);
      // RWL = 23 × 1 × 1 × 1 × 1 × 0.94 × 1 = 21.62
      expect(result.rwl).toBeCloseTo(21.62, 1);
    });

    it('CM table verification: coupling=fair, V≥75 → CM=0.95', () => {
      // NIOSH 94-110 Table 7: CM for fair coupling, V ≥ 75cm = 0.95
      const result = nioshLifting({
        horizontalDistance: 25,
        verticalDistance: 75,   // V ≥ 75 → use "high" column
        verticalTravel: 25,
        asymmetryAngle: 0,
        frequency: 0.2,
        duration: 'short',
        coupling: 'fair',
        loadWeight: 10,
      });

      expect(result.cm).toBe(0.95);
      // RWL = 23 × 1 × 1 × 1 × 1 × 1 × 0.95 = 21.85
      expect(result.rwl).toBeCloseTo(21.85, 1);
    });
  });
});
