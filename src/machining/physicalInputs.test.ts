import { describe, it, expect } from 'vitest';
import { cycleTimeEstimator } from './cycleTimeEstimator.js';
import { radialChipThinning } from './radialChipThinning.js';
import { sineBarHeight } from './sineBarHeight.js';

// A negative physical quantity has no meaning; returning a sign-flipped "result" for it presents
// garbage as a calculation. Each function refuses it, and accepts the domain boundary.
describe('machining: physical input domains', () => {
  it('cycleTimeEstimator refuses a negative distance or time and accepts 0', () => {
    expect(() => cycleTimeEstimator({ operations: [{ type: 'cutting', distance: -100, feedRate: 500 }] })).toThrow(RangeError);
    expect(() => cycleTimeEstimator({ operations: [{ type: 'dwell', time: -2 }] })).toThrow(RangeError);
    expect(() => cycleTimeEstimator({ operations: [{ type: 'dwell', time: 2 }], setupTime: -60 })).toThrow(RangeError);
    // A cutting move without a positive feed was silently skipped
    expect(() => cycleTimeEstimator({ operations: [{ type: 'cutting', distance: 100, feedRate: 0 }] })).toThrow(RangeError);
    expect(() => cycleTimeEstimator({ operations: [{ type: 'cutting', distance: 100, feedRate: -200 }] })).toThrow(RangeError);
    expect(() => cycleTimeEstimator({ operations: [{ type: 'cutting', distance: 100 }] })).toThrow(RangeError);
    const r = cycleTimeEstimator({
      operations: [
        { type: 'cutting', distance: 0, feedRate: 500 },
        { type: 'dwell', time: 0 },
        { type: 'toolChange', time: 5 },
      ],
    });
    expect(r.cycleTime).toBe(5);
    expect(r.utilization).toBe(0);
  });

  it('radialChipThinning refuses a non-positive chipLoadTarget', () => {
    expect(() => radialChipThinning({ toolDiameter: 10, radialDepthOfCut: 2, chipLoadTarget: -0.05 })).toThrow(RangeError);
    expect(() => radialChipThinning({ toolDiameter: 10, radialDepthOfCut: 2, chipLoadTarget: 0 })).toThrow(RangeError);
    // ae = D/2 → factor 1, no thinning
    const r = radialChipThinning({ toolDiameter: 10, radialDepthOfCut: 5, chipLoadTarget: 0.05 });
    expect(r.chipThinningFactor).toBe(1);
    expect(r.adjustedFeedPerTooth).toBe(0.05);
  });

  it('sineBarHeight refuses a provided roundToBlock that is not greater than 0', () => {
    expect(() => sineBarHeight({ angle: 30, sineBarLength: 100, roundToBlock: 0 })).toThrow(RangeError);
    expect(() => sineBarHeight({ angle: 30, sineBarLength: 100, roundToBlock: -0.001 })).toThrow(RangeError);
    const r = sineBarHeight({ angle: 30, sineBarLength: 100, roundToBlock: 0.0001 });
    expect(r.roundedHeight).toBeCloseTo(50, 4);
    expect(r.actualAngle).toBeCloseTo(30, 4);
  });
});
