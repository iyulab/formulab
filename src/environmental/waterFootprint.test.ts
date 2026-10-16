import { describe, it, expect } from 'vitest';
import { waterFootprint } from './waterFootprint.js';

describe('waterFootprint', () => {
  it('should calculate total and percentages', () => {
    const result = waterFootprint({
      blueWaterM3: 500,
      greenWaterM3: 300,
      greyWaterM3: 200,
    });
    expect(result.totalWaterM3).toBeCloseTo(1000, 0);
    expect(result.bluePercent).toBeCloseTo(50, 0);
    expect(result.greenPercent).toBeCloseTo(30, 0);
    expect(result.greyPercent).toBeCloseTo(20, 0);
    expect(result.perUnitM3).toBeUndefined();
  });

  it('should calculate per-unit water footprint', () => {
    const result = waterFootprint({
      blueWaterM3: 1000,
      greenWaterM3: 500,
      greyWaterM3: 300,
      productionUnits: 100,
    });
    expect(result.totalWaterM3).toBeCloseTo(1800, 0);
    expect(result.perUnitM3).toBeCloseTo(18, 1);
  });

  it('should handle agricultural product (mostly green water)', () => {
    const result = waterFootprint({
      blueWaterM3: 100,
      greenWaterM3: 900,
      greyWaterM3: 50,
    });
    expect(result.greenPercent).toBeGreaterThan(80);
  });

  it('should handle industrial process (mostly blue water)', () => {
    const result = waterFootprint({
      blueWaterM3: 800,
      greenWaterM3: 50,
      greyWaterM3: 150,
    });
    expect(result.bluePercent).toBeCloseTo(80, 0);
  });

  it('should handle zero values for some types', () => {
    const result = waterFootprint({
      blueWaterM3: 500,
      greenWaterM3: 0,
      greyWaterM3: 500,
    });
    expect(result.totalWaterM3).toBeCloseTo(1000, 0);
    expect(result.greenPercent).toBeCloseTo(0, 0);
  });
});

describe('waterFootprint contract restoration (2026-07 audit)', () => {
  it('has no breakdown for an all-zero footprint — null, not 0 %', () => {
    const result = waterFootprint({ blueWaterM3: 0, greenWaterM3: 0, greyWaterM3: 0 });
    expect(result.totalWaterM3).toBe(0);
    expect(result.bluePercent).toBeNull();
    expect(result.greenPercent).toBeNull();
    expect(result.greyPercent).toBeNull();
  });

  it('throws RangeError for a negative water volume', () => {
    expect(() => waterFootprint({ blueWaterM3: -1, greenWaterM3: 0, greyWaterM3: 0 })).toThrow(RangeError);
  });
});

describe('waterFootprint coded refusals', () => {
  it('names blueWaterM3', () => {
    expect(() => waterFootprint({ blueWaterM3: -1, greenWaterM3: 0, greyWaterM3: 0 })).toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'blueWaterM3', min: 0, got: -1 }));
  });
  it('names greenWaterM3', () => {
    expect(() => waterFootprint({ blueWaterM3: 0, greenWaterM3: -1, greyWaterM3: 0 })).toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'greenWaterM3', min: 0, got: -1 }));
  });
  it('names greyWaterM3', () => {
    expect(() => waterFootprint({ blueWaterM3: 0, greenWaterM3: 0, greyWaterM3: -1 })).toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'greyWaterM3', min: 0, got: -1 }));
  });
});
