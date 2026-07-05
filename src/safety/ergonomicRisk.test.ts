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

  describe('Table A golden cells (published REBA worksheet)', () => {
    it('Trunk=1, Neck=3, Legs=1 → posture score 3 (irregular cell)', () => {
      // neck 10° (1) + twisted + side bent = 3; trunk 0° = 1; legs bilateral = 1
      const r = ergonomicRisk({ ...neutralPosture, neckTwisted: true, neckSideBent: true });
      expect(r.neckScore).toBe(3);
      expect(r.trunkScore).toBe(1);
      expect(r.scoreA).toBe(3); // old transcription gave 2
    });

    it('Trunk=1, Neck=2, Legs=1 → posture score 1 (N1 and N2 rows identical for Trunk 1)', () => {
      const r = ergonomicRisk({ ...neutralPosture, neckAngle: 25 });
      expect(r.neckScore).toBe(2);
      expect(r.scoreA).toBe(1); // old transcription gave 2
    });

    it('Trunk=3, Neck=1, Legs=2 → posture score 4', () => {
      const r = ergonomicRisk({ ...neutralPosture, trunkAngle: 45, legSupport: 'unilateral' });
      expect(r.trunkScore).toBe(3);
      expect(r.legScore).toBe(2);
      expect(r.scoreA).toBe(4); // old transcription gave 6
    });

    it('Trunk=5, Neck=3, Legs=4 → posture score 9 (table maximum)', () => {
      const r = ergonomicRisk({
        ...neutralPosture,
        trunkAngle: 70, trunkTwisted: true, trunkSideBent: true,
        neckAngle: 25, neckTwisted: true, neckSideBent: true,
        legSupport: 'unilateral', kneeFlexion: 70,
      });
      expect(r.scoreA).toBe(9); // Table A caps at 9, old table reached 12
    });
  });

  describe('Table B golden cells (published REBA worksheet)', () => {
    it('UA=2, LA=2, Wrist=1 → posture score 2', () => {
      const r = ergonomicRisk({ ...neutralPosture, upperArmAngle: 30, lowerArmAngle: 30 });
      expect(r.upperArmScore).toBe(2);
      expect(r.lowerArmScore).toBe(2);
      expect(r.scoreB).toBe(2); // old transcription gave 4
    });

    it('UA=4, LA=1, Wrist=2 → posture score 5', () => {
      const r = ergonomicRisk({
        ...neutralPosture,
        upperArmAngle: 60, shoulderRaised: true, wristAngle: 20,
      });
      expect(r.upperArmScore).toBe(4);
      expect(r.wristScore).toBe(2);
      expect(r.scoreB).toBe(5); // old transcription gave 8
    });

    it('UA=6, LA=2, Wrist=3 → posture score 9 (table maximum)', () => {
      const r = ergonomicRisk({
        ...neutralPosture,
        upperArmAngle: 100, shoulderRaised: true, armAbducted: true,
        lowerArmAngle: 30, wristAngle: 20, wristTwisted: true,
      });
      expect(r.scoreB).toBe(9);
    });
  });

  describe('coupling (Step 11)', () => {
    it('defaults to good coupling (+0)', () => {
      const r = ergonomicRisk(neutralPosture);
      expect(r.couplingScore).toBe(0);
    });

    it('adds +1/+2/+3 for fair/poor/unacceptable coupling', () => {
      const base = ergonomicRisk(neutralPosture);
      const fair = ergonomicRisk({ ...neutralPosture, coupling: 'fair' });
      const poor = ergonomicRisk({ ...neutralPosture, coupling: 'poor' });
      const unacceptable = ergonomicRisk({ ...neutralPosture, coupling: 'unacceptable' });

      expect(fair.couplingScore).toBe(1);
      expect(poor.couplingScore).toBe(2);
      expect(unacceptable.couplingScore).toBe(3);
      expect(fair.scoreB).toBe(base.scoreB + 1);
      expect(poor.scoreB).toBe(base.scoreB + 2);
      expect(unacceptable.scoreB).toBe(base.scoreB + 3);
    });
  });

  describe('extension handling (published worksheet zones)', () => {
    it('trunk extension beyond 20° scores 3 regardless of magnitude', () => {
      expect(ergonomicRisk({ ...neutralPosture, trunkAngle: -30 }).trunkScore).toBe(3);
      expect(ergonomicRisk({ ...neutralPosture, trunkAngle: -70 }).trunkScore).toBe(3);
    });

    it('upper arm extension beyond 20° scores 2 regardless of magnitude', () => {
      expect(ergonomicRisk({ ...neutralPosture, upperArmAngle: -30 }).upperArmScore).toBe(2);
      expect(ergonomicRisk({ ...neutralPosture, upperArmAngle: -60 }).upperArmScore).toBe(2);
    });
  });

  describe('worked example (full pipeline)', () => {
    it('neutral posture resolves to REBA score 1 = negligible', () => {
      const r = ergonomicRisk(neutralPosture);
      expect(r.scoreA).toBe(1);
      expect(r.scoreB).toBe(1);
      expect(r.scoreC).toBe(1);
      expect(r.rebaScore).toBe(1);
      expect(r.riskLevel).toBe('negligible');
    });
  });

  describe('input validation', () => {
    it('should throw RangeError for negative load', () => {
      expect(() => ergonomicRisk({ ...neutralPosture, load: -1 })).toThrow(RangeError);
    });

    it('should accept negative joint angles (flexion/extension)', () => {
      expect(() => ergonomicRisk({ ...neutralPosture, trunkAngle: -15, wristAngle: -10 })).not.toThrow();
    });
  });
});
