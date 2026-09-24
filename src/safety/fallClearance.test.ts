import { describe, it, expect } from 'vitest';
import { fallClearance } from './fallClearance.js';
import type { FallClearanceInput } from './types.js';

const FT = 0.3048;

/**
 * Golden case: the widely published fixed-lanyard clearance — 6 ft lanyard + 3.5 ft deceleration +
 * 1 ft harness stretch + 5 ft D-ring height + 3 ft safety factor = 18.5 ft below the anchor
 * (manufacturer clearance charts; ARTBA fall-protection fact sheet). Anchor at D-ring height.
 */
const EIGHTEEN_FIVE: FallClearanceInput = {
  lanyardLength: 6 * FT,
  decelerationDistance: 3.5 * FT,
  harnessStretch: 1 * FT,
  dRingHeight: 5 * FT,
  anchorAboveFeet: 5 * FT,
  safetyFactor: 3 * FT,
};

describe('fallClearance', () => {
  describe('18.5 ft rule (golden)', () => {
    const r = fallClearance(EIGHTEEN_FIVE);

    it('clearance below the anchor is 18.5 ft', () => {
      expect(r.clearanceBelowAnchor / FT).toBeCloseTo(18.5, 2);
    });

    it('with the anchor at D-ring height the feet travel 10.5 ft and need 13.5 ft below the working surface', () => {
      expect(r.totalFallDistance / FT).toBeCloseTo(10.5, 2);
      expect(r.requiredClearance / FT).toBeCloseTo(13.5, 2);
    });

    it('free fall equals the lanyard length (6 ft) — exactly the OSHA limit, no warning', () => {
      expect(r.freeFallDistance / FT).toBeCloseTo(6, 2);
      expect(r.warnings).toEqual([]);
    });

    it('the same case written out literally (fixture for check:nonfinite-outputs)', () => {
      expect(
        fallClearance({
          lanyardLength: 1.8288,
          decelerationDistance: 1.0668,
          harnessStretch: 0.3048,
          dRingHeight: 1.524,
          anchorAboveFeet: 1.524,
          safetyFactor: 0.9144,
          workingHeight: 6,
          obstacleHeight: 0,
        }).clearanceBelowAnchor,
      ).toBeCloseTo(5.639, 3);
    });
  });

  describe('anchor height is measured from the feet, once', () => {
    const example: FallClearanceInput = {
      lanyardLength: 1.8,
      decelerationDistance: 1.07,
      harnessStretch: 0.3,
      dRingHeight: 1.8,
      anchorAboveFeet: 0.15,
      safetyFactor: 0.6,
    };

    it('total fall distance subtracts the anchor height: 1.8 + 1.07 + 0.3 + 1.8 − 0.15 = 4.82 m', () => {
      expect(fallClearance(example).totalFallDistance).toBeCloseTo(4.82, 3);
    });

    it('required clearance adds the safety factor: 5.42 m', () => {
      expect(fallClearance(example).requiredClearance).toBeCloseTo(5.42, 3);
    });

    it('clearance below the anchor does not depend on where the anchor is', () => {
      const low = fallClearance({ ...example, anchorAboveFeet: 0 });
      const high = fallClearance({ ...example, anchorAboveFeet: 2 });
      expect(low.clearanceBelowAnchor).toBe(high.clearanceBelowAnchor);
      expect(low.requiredClearance - high.requiredClearance).toBeCloseTo(2, 6);
    });
  });

  describe('adequacy needs the working height', () => {
    it('is null without workingHeight — the verdict is not computable', () => {
      const r = fallClearance(EIGHTEEN_FIVE);
      expect(r.clearanceAboveObstacle).toBeNull();
      expect(r.isAdequate).toBeNull();
    });

    it('is adequate when the working surface is higher than the required clearance', () => {
      const r = fallClearance({ ...EIGHTEEN_FIVE, workingHeight: 5 });
      expect(r.clearanceAboveObstacle).toBeCloseTo(5 - 13.5 * FT, 3);
      expect(r.isAdequate).toBe(true);
    });

    it('is exactly adequate at zero margin', () => {
      const r = fallClearance({ ...EIGHTEEN_FIVE, workingHeight: 13.5 * FT });
      expect(r.clearanceAboveObstacle).toBeCloseTo(0, 6);
      expect(r.isAdequate).toBe(true);
    });

    it('an obstacle above the lower level eats into the margin', () => {
      const r = fallClearance({ ...EIGHTEEN_FIVE, workingHeight: 5, obstacleHeight: 1.5 });
      expect(r.clearanceAboveObstacle).toBeCloseTo(5 - 1.5 - 13.5 * FT, 3);
      expect(r.isAdequate).toBe(false);
      expect(r.warnings.some((w) => w.startsWith('Insufficient clearance'))).toBe(true);
    });
  });

  describe('OSHA 1926.502(d)(16) limits', () => {
    it('warns when the anchor is below the D-ring far enough for free fall to exceed 1.8 m', () => {
      const r = fallClearance({ ...EIGHTEEN_FIVE, anchorAboveFeet: 0 });
      expect(r.freeFallDistance).toBeCloseTo(6 * FT + 5 * FT, 3);
      expect(r.warnings.some((w) => w.startsWith('Free fall'))).toBe(true);
    });

    it('free fall is zero when the anchor is high enough to keep the lanyard slack-free', () => {
      expect(fallClearance({ ...EIGHTEEN_FIVE, anchorAboveFeet: 5 }).freeFallDistance).toBe(0);
    });

    it('accepts an anchor below the feet and reports it through the free-fall warning', () => {
      const r = fallClearance({ ...EIGHTEEN_FIVE, anchorAboveFeet: -0.5 });
      expect(r.totalFallDistance).toBeCloseTo(r.clearanceBelowAnchor - 3 * FT + 0.5, 2);
      expect(r.warnings.some((w) => w.startsWith('Free fall'))).toBe(true);
    });

    it('warns when deceleration exceeds 1.07 m', () => {
      const r = fallClearance({ ...EIGHTEEN_FIVE, decelerationDistance: 1.2 });
      expect(r.warnings).toContain('Deceleration distance exceeds the OSHA limit of 1.07 m (3.5 ft)');
    });
  });

  describe('input validation', () => {
    it('throws for a non-positive D-ring height', () => {
      expect(() => fallClearance({ ...EIGHTEEN_FIVE, dRingHeight: 0 })).toThrow(RangeError);
    });

    it.each([
      ['lanyardLength', { lanyardLength: -0.1 }],
      ['decelerationDistance', { decelerationDistance: -0.1 }],
      ['harnessStretch', { harnessStretch: -0.1 }],
      ['safetyFactor', { safetyFactor: -0.1 }],
      ['workingHeight', { workingHeight: -1 }],
      ['obstacleHeight', { obstacleHeight: -0.1 }],
    ])('throws for a negative %s', (_label, override) => {
      expect(() => fallClearance({ ...EIGHTEEN_FIVE, ...override })).toThrow(RangeError);
    });
  });
});
