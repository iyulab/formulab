import { describe, it, expect } from 'vitest';
import { cuspHeight } from './cuspHeight.js';

describe('cuspHeight', () => {
  it('should calculate cusp height for 5mm radius, 1mm stepover', () => {
    const result = cuspHeight({
      toolRadius: 5,
      stepover: 1,
    });

    // h = 5 - √(25 - 0.25) = 5 - √24.75 = 5 - 4.974937 = 0.025063 mm
    expect(result.cuspHeight).toBeCloseTo(0.025, 2);
    // Ra ≈ h(mm) × 1000 / 4 = 0.025063 × 1000 / 4 = 6.2657 μm
    expect(result.surfaceRoughness).toBeCloseTo(6.27, 1);
  });

  it('should calculate cusp height for 10mm radius, 2mm stepover', () => {
    const result = cuspHeight({
      toolRadius: 10,
      stepover: 2,
    });

    // h = 10 - √(100 - 1) = 10 - √99 = 10 - 9.9499 = 0.0501
    expect(result.cuspHeight).toBeCloseTo(0.0501, 3);
  });

  it('should return larger cusp for larger stepover', () => {
    const small = cuspHeight({ toolRadius: 5, stepover: 0.5 });
    const large = cuspHeight({ toolRadius: 5, stepover: 2 });

    expect(large.cuspHeight).toBeGreaterThan(small.cuspHeight);
  });

  it('should return smaller cusp for larger tool radius', () => {
    const small = cuspHeight({ toolRadius: 3, stepover: 1 });
    const large = cuspHeight({ toolRadius: 10, stepover: 1 });

    expect(large.cuspHeight).toBeLessThan(small.cuspHeight);
  });

  it('should calculate approximate surface roughness', () => {
    const result = cuspHeight({
      toolRadius: 5,
      stepover: 1,
    });

    // Ra ≈ h_mm * 1000 / 4 (in μm)
    expect(result.surfaceRoughness).toBeCloseTo(result.cuspHeight * 1000 / 4, 1);
  });

  describe('invalid input', () => {
    // Without a guard the formula reaches Math.sqrt of a negative number and returns NaN,
    // which flows straight through a caller into whatever it renders. A stepover wider
    // than the tool diameter is not a shallow scallop — the passes never meet, and the
    // formula has nothing to say about the ridge left between them.
    it('should throw when the stepover exceeds the tool diameter', () => {
      expect(() => cuspHeight({ toolRadius: 3, stepover: 6.5 })).toThrow(RangeError);
    });

    it('should accept a stepover of exactly the tool diameter', () => {
      // The two passes just touch; the ridge is a full tool radius high.
      expect(cuspHeight({ toolRadius: 3, stepover: 6 }).cuspHeight).toBeCloseTo(3, 6);
    });

    it('should throw for a non-positive tool radius', () => {
      expect(() => cuspHeight({ toolRadius: 0, stepover: 1 })).toThrow(RangeError);
      expect(() => cuspHeight({ toolRadius: -3, stepover: 1 })).toThrow(RangeError);
    });

    it('should throw for a non-positive stepover', () => {
      expect(() => cuspHeight({ toolRadius: 3, stepover: 0 })).toThrow(RangeError);
      expect(() => cuspHeight({ toolRadius: 3, stepover: -1 })).toThrow(RangeError);
    });
  });
});
