import { describe, it, expect } from 'vitest';
import { effectiveDiameter } from './effectiveDiameter.js';

describe('effectiveDiameter', () => {
  it('should calculate effective diameter for 10mm ball mill at 1mm depth', () => {
    const result = effectiveDiameter({
      toolDiameter: 10,
      axialDepthOfCut: 1,
    });

    // Deff = 2 × √(1 × (10-1)) = 2 × √9 = 6.0
    expect(result.effectiveDiameter).toBe(6);
  });

  it('should calculate effective diameter at equator (ap = D/2)', () => {
    const result = effectiveDiameter({
      toolDiameter: 10,
      axialDepthOfCut: 5,
    });

    // Deff = 2 × √(5 × 5) = 2 × 5 = 10
    expect(result.effectiveDiameter).toBe(10);
  });

  it('should calculate for small depth of cut', () => {
    const result = effectiveDiameter({
      toolDiameter: 20,
      axialDepthOfCut: 0.5,
    });

    // Deff = 2 × √(0.5 × 19.5) = 2 × √9.75 = 2 × 3.1225 = 6.2450
    expect(result.effectiveDiameter).toBeCloseTo(6.245, 2);
  });

  it('should give larger Deff for larger depth of cut (up to D/2)', () => {
    const shallow = effectiveDiameter({ toolDiameter: 10, axialDepthOfCut: 1 });
    const deep = effectiveDiameter({ toolDiameter: 10, axialDepthOfCut: 3 });

    expect(deep.effectiveDiameter).toBeGreaterThan(shallow.effectiveDiameter);
  });

  it('should handle 16mm ball mill at 2mm depth', () => {
    const result = effectiveDiameter({
      toolDiameter: 16,
      axialDepthOfCut: 2,
    });

    // Deff = 2 × √(2 × 14) = 2 × √28 = 2 × 5.2915 = 10.5830
    expect(result.effectiveDiameter).toBeCloseTo(10.583, 2);
  });

  it('should return rpmCorrectionFactor = D / Deff', () => {
    // D=10, ap=2 → Deff = 2 × √(2 × 8) = 8 → factor = 1.25
    const result = effectiveDiameter({ toolDiameter: 10, axialDepthOfCut: 2 });
    expect(result.effectiveDiameter).toBe(8);
    expect(result.rpmCorrectionFactor).toBe(1.25);
    expect(result.effectiveRpm).toBeUndefined();
  });

  it('should compute effectiveRpm when cuttingSpeed is provided', () => {
    // D=10, ap=2 → Deff=8; Vc=100 m/min → n = 100000 / (π × 8) ≈ 3978.9
    const result = effectiveDiameter({ toolDiameter: 10, axialDepthOfCut: 2, cuttingSpeed: 100 });
    expect(result.effectiveRpm).toBeCloseTo(3978.9, 0);
  });

  it('should clamp Deff to D beyond the equator (ap > D/2)', () => {
    const result = effectiveDiameter({ toolDiameter: 10, axialDepthOfCut: 7 });
    expect(result.effectiveDiameter).toBe(10);
    expect(result.rpmCorrectionFactor).toBe(1);
  });

  it('should throw RangeError on invalid inputs', () => {
    expect(() => effectiveDiameter({ toolDiameter: 0, axialDepthOfCut: 1 })).toThrow(RangeError);
    expect(() => effectiveDiameter({ toolDiameter: 10, axialDepthOfCut: 0 })).toThrow(RangeError);
    expect(() => effectiveDiameter({ toolDiameter: 10, axialDepthOfCut: 11 })).toThrow(RangeError);
    expect(() => effectiveDiameter({ toolDiameter: 10, axialDepthOfCut: 2, cuttingSpeed: 0 })).toThrow(RangeError);
  });
});
