import { describe, it, expect } from 'vitest';
import { vocEmissions } from './vocEmissions.js';

describe('vocEmissions', () => {
  it('should calculate with 95% capture, 99% destruction', () => {
    // 100 kg total, captured = 95 kg, destroyed = 94.05 kg, emitted = 5.95 kg
    const result = vocEmissions({
      totalVocKg: 100,
      captureEfficiency: 0.95,
      destructionEfficiency: 0.99,
    });
    expect(result.capturedVocKg).toBeCloseTo(95, 1);
    expect(result.destroyedVocKg).toBeCloseTo(94.05, 1);
    expect(result.emittedVocKg).toBeCloseTo(5.95, 1);
    expect(result.reductionPercent).toBeCloseTo(94.05, 1);
  });

  it('should handle no capture (open emission)', () => {
    const result = vocEmissions({
      totalVocKg: 50,
      captureEfficiency: 0,
      destructionEfficiency: 0.99,
    });
    expect(result.emittedVocKg).toBeCloseTo(50, 1);
    expect(result.capturedVocKg).toBeCloseTo(0, 1);
    expect(result.reductionPercent).toBeCloseTo(0, 1);
  });

  it('should handle perfect capture and destruction', () => {
    const result = vocEmissions({
      totalVocKg: 200,
      captureEfficiency: 1.0,
      destructionEfficiency: 1.0,
    });
    expect(result.emittedVocKg).toBeCloseTo(0, 1);
    expect(result.reductionPercent).toBeCloseTo(100, 1);
  });

  it('should handle 80% capture, 90% destruction', () => {
    // 1000 kg, captured = 800, destroyed = 720, emitted = 280
    const result = vocEmissions({
      totalVocKg: 1000,
      captureEfficiency: 0.8,
      destructionEfficiency: 0.9,
    });
    expect(result.capturedVocKg).toBeCloseTo(800, 0);
    expect(result.destroyedVocKg).toBeCloseTo(720, 0);
    expect(result.emittedVocKg).toBeCloseTo(280, 0);
    expect(result.reductionPercent).toBeCloseTo(72, 0);
  });
});

describe('vocEmissions contract restoration (2026-07 audit)', () => {
  it('reports reductionPercent 0 for zero VOC total instead of NaN (valid-but-degenerate)', () => {
    const result = vocEmissions({ totalVocKg: 0, captureEfficiency: 0.9, destructionEfficiency: 0.95 });
    expect(result.reductionPercent).toBe(0);
    expect(result.emittedVocKg).toBe(0);
  });

  it('throws RangeError for negative totalVocKg', () => {
    expect(() => vocEmissions({ totalVocKg: -1, captureEfficiency: 0.9, destructionEfficiency: 0.95 })).toThrow(RangeError);
  });

  it('throws RangeError for efficiencies outside [0, 1]', () => {
    expect(() => vocEmissions({ totalVocKg: 100, captureEfficiency: 1.5, destructionEfficiency: 0.95 })).toThrow(RangeError);
    expect(() => vocEmissions({ totalVocKg: 100, captureEfficiency: 0.9, destructionEfficiency: -0.1 })).toThrow(RangeError);
  });
});
