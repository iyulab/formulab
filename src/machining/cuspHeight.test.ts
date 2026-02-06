import { describe, it, expect } from 'vitest';
import { cuspHeight } from './cuspHeight.js';

describe('cuspHeight', () => {
  it('should calculate cusp height for 5mm radius, 1mm stepover', () => {
    const result = cuspHeight({
      toolRadius: 5,
      stepover: 1,
    });

    // h = 5 - √(25 - 0.25) = 5 - √24.75 = 5 - 4.97494 = 0.02506
    expect(result.cuspHeight).toBeCloseTo(0.025, 2);
    expect(result.surfaceRoughness).toBeGreaterThan(0);
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
});
