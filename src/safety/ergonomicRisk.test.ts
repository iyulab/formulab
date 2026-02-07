import { describe, it, expect } from 'vitest';
import { ergonomicRisk } from './ergonomicRisk.js';

const neutralPosture: Parameters<typeof ergonomicRisk>[0] = {
  trunkAngle: 0,
  trunkTwisted: false,
  trunkSideBent: false,
  neckAngle: 10,
  neckTwisted: false,
  neckSideBent: false,
  legSupport: 'bilateral',
  kneeFlexion: 0,
  upperArmAngle: 10,
  shoulderRaised: false,
  armAbducted: false,
  armSupported: false,
  lowerArmAngle: 80,
  wristAngle: 5,
  wristTwisted: false,
  load: 0,
  shockForce: false,
  staticPosture: false,
  repeatedSmallRange: false,
  rapidLargeChange: false,
};

describe('ergonomicRisk (REBA)', () => {
  describe('neutral posture', () => {
    it('should return low risk for neutral posture', () => {
      const result = ergonomicRisk(neutralPosture);
      expect(result.rebaScore).toBeLessThanOrEqual(3);
      expect(result.riskLevel).toMatch(/negligible|low/);
      expect(result.actionLevel).toBeLessThanOrEqual(1);
    });
  });

  describe('individual scores', () => {
    it('should score trunk correctly', () => {
      // 0° = 1, 0-20° = 2, 20-60° = 3, >60° = 4
      const r1 = ergonomicRisk({ ...neutralPosture, trunkAngle: 0 });
      expect(r1.trunkScore).toBe(1);

      const r2 = ergonomicRisk({ ...neutralPosture, trunkAngle: 15 });
      expect(r2.trunkScore).toBe(2);

      const r3 = ergonomicRisk({ ...neutralPosture, trunkAngle: 45 });
      expect(r3.trunkScore).toBe(3);

      const r4 = ergonomicRisk({ ...neutralPosture, trunkAngle: 70 });
      expect(r4.trunkScore).toBe(4);
    });

    it('should add modifiers for trunk twist/side bend', () => {
      const base = ergonomicRisk({ ...neutralPosture, trunkAngle: 15 });
      const twisted = ergonomicRisk({ ...neutralPosture, trunkAngle: 15, trunkTwisted: true });
      const both = ergonomicRisk({ ...neutralPosture, trunkAngle: 15, trunkTwisted: true, trunkSideBent: true });

      expect(twisted.trunkScore).toBe(base.trunkScore + 1);
      expect(both.trunkScore).toBe(base.trunkScore + 2);
    });

    it('should score neck correctly', () => {
      const r1 = ergonomicRisk({ ...neutralPosture, neckAngle: 10 });
      expect(r1.neckScore).toBe(1);

      const r2 = ergonomicRisk({ ...neutralPosture, neckAngle: 25 });
      expect(r2.neckScore).toBe(2);
    });

    it('should score upper arm correctly', () => {
      const r1 = ergonomicRisk({ ...neutralPosture, upperArmAngle: 10 });
      expect(r1.upperArmScore).toBe(1);

      const r2 = ergonomicRisk({ ...neutralPosture, upperArmAngle: 30 });
      expect(r2.upperArmScore).toBe(2);

      const r3 = ergonomicRisk({ ...neutralPosture, upperArmAngle: 60 });
      expect(r3.upperArmScore).toBe(3);

      const r4 = ergonomicRisk({ ...neutralPosture, upperArmAngle: 100 });
      expect(r4.upperArmScore).toBe(4);
    });

    it('should reduce upper arm score when arm is supported', () => {
      const unsupported = ergonomicRisk({ ...neutralPosture, upperArmAngle: 30 });
      const supported = ergonomicRisk({ ...neutralPosture, upperArmAngle: 30, armSupported: true });

      expect(supported.upperArmScore).toBe(unsupported.upperArmScore - 1);
    });
  });

  describe('risk levels', () => {
    it('should classify high risk for heavy load + bad posture', () => {
      const result = ergonomicRisk({
        ...neutralPosture,
        trunkAngle: 60,
        trunkTwisted: true,
        neckAngle: 25,
        neckTwisted: true,
        upperArmAngle: 90,
        shoulderRaised: true,
        load: 15,
        shockForce: true,
        staticPosture: true,
        repeatedSmallRange: true,
      });

      expect(result.rebaScore).toBeGreaterThanOrEqual(8);
      expect(result.riskLevel).toMatch(/high|very_high/);
    });

    it('should have action level 0 for negligible risk', () => {
      const result = ergonomicRisk(neutralPosture);
      if (result.rebaScore <= 1) {
        expect(result.actionLevel).toBe(0);
      }
    });
  });

  describe('activity modifiers', () => {
    it('should increase score with activity modifiers', () => {
      const base = ergonomicRisk(neutralPosture);
      const withActivity = ergonomicRisk({
        ...neutralPosture,
        staticPosture: true,
        repeatedSmallRange: true,
        rapidLargeChange: true,
      });

      expect(withActivity.rebaScore).toBe(base.rebaScore + 3);
    });
  });
});
