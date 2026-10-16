import { describe, it, expect } from 'vitest';
import { truePosition } from './truePosition.js';

describe('truePosition', () => {
  it('should calculate TP for simple deviation', () => {
    const result = truePosition({
      actualX: 10.1,
      actualY: 20.2,
      nominalX: 10,
      nominalY: 20,
    });

    // Δx = 0.1, Δy = 0.2
    // radial = √(0.01 + 0.04) = √0.05 = 0.22361
    // TP = 2 × 0.22361 = 0.44721
    expect(result.deviationX).toBeCloseTo(0.1, 4);
    expect(result.deviationY).toBeCloseTo(0.2, 4);
    expect(result.radialDeviation).toBeCloseTo(0.2236, 3);
    expect(result.truePosition).toBeCloseTo(0.4472, 3);
  });

  it('should evaluate in-tolerance with RFS', () => {
    const result = truePosition({
      actualX: 10.05,
      actualY: 20.05,
      nominalX: 10,
      nominalY: 20,
      tolerance: 0.2,
    });

    // radial = √(0.0025 + 0.0025) = 0.07071
    // TP = 0.14142
    expect(result.truePosition).toBeCloseTo(0.1414, 3);
    expect(result.inTolerance).toBe(true);
  });

  it('should detect out-of-tolerance', () => {
    const result = truePosition({
      actualX: 10.3,
      actualY: 20.3,
      nominalX: 10,
      nominalY: 20,
      tolerance: 0.5,
    });

    // radial = √(0.09+0.09) = 0.42426
    // TP = 0.84853
    expect(result.inTolerance).toBe(false);
  });

  it('should calculate MMC bonus tolerance', () => {
    const result = truePosition({
      actualX: 10.1,
      actualY: 20.1,
      nominalX: 10,
      nominalY: 20,
      tolerance: 0.2,
      featureSize: 10.5,  // actual hole size
      mmcSize: 10.2,      // MMC (smallest hole)
    });

    // bonus = 10.5 - 10.2 = 0.3
    // effectiveTol = 0.2 + 0.3 = 0.5
    expect(result.mmcBonus).toBeCloseTo(0.3, 4);
    expect(result.effectiveTolerance).toBeCloseTo(0.5, 4);
    // TP = 2 × √(0.01+0.01) = 0.2828 < 0.5
    expect(result.inTolerance).toBe(true);
  });

  it('should have zero bonus when feature is at MMC', () => {
    const result = truePosition({
      actualX: 10,
      actualY: 20,
      nominalX: 10,
      nominalY: 20,
      tolerance: 0.2,
      featureSize: 10.2,
      mmcSize: 10.2,
    });

    expect(result.mmcBonus).toBe(0);
    expect(result.effectiveTolerance).toBeCloseTo(0.2, 4);
  });

  it('should handle zero deviation', () => {
    const result = truePosition({
      actualX: 50,
      actualY: 50,
      nominalX: 50,
      nominalY: 50,
    });

    expect(result.truePosition).toBe(0);
    expect(result.radialDeviation).toBe(0);
  });

  it('throws on a non-finite coordinate or a negative tolerance/size, and accepts negative coordinates', () => {
    expect(truePosition({ actualX: -10.05, actualY: -5.02, nominalX: -10, nominalY: -5 }).radialDeviation).toBeCloseTo(0.0539, 4);
    expect(() => truePosition({ actualX: Number.NaN, actualY: 0, nominalX: 0, nominalY: 0 })).toThrow(RangeError);
    expect(() => truePosition({ actualX: 1, actualY: 0, nominalX: 0, nominalY: 0, tolerance: -0.1 })).toThrow(RangeError);
    expect(() => truePosition({ actualX: 1, actualY: 0, nominalX: 0, nominalY: 0, featureSize: -1, mmcSize: 5 })).toThrow(RangeError);
  });
});

describe('truePosition coded refusals', () => {
  it('names the refused input and its bound', () => {
    expect(() => truePosition({ actualX: 1, actualY: undefined as never, nominalX: 0, nominalY: 0 }))
      .toThrow(expect.objectContaining({ code: 'value_not_finite', parameter: 'actualY' }));
    expect(() => truePosition({ actualX: 1, actualY: 0, nominalX: 0, nominalY: 0, tolerance: -0.1 }))
      .toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'tolerance', min: 0, got: -0.1 }));
  });
});
