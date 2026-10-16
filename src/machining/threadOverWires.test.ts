import { describe, it, expect } from 'vitest';
import { threadOverWires } from './threadOverWires.js';

describe('threadOverWires', () => {
  it('should calculate M10×1.5 measurement over wires (60°)', () => {
    const result = threadOverWires({
      majorDiameter: 10,
      pitch: 1.5,
    });

    // bestWire = 1.5 / √3 = 0.86603
    expect(result.bestWireSize).toBeCloseTo(0.866, 3);

    // d₂ = 10 - 0.6495 × 1.5 = 10 - 0.97425 = 9.02575
    expect(result.pitchDiameter).toBeCloseTo(9.0258, 3);

    // General formula: M = d₂ + W(1 + 1/sin(α/2)) - P·cos(α/2)/(2·sin(α/2))
    // For 60°: sin(30°)=0.5, cos(30°)=0.86603
    // M = 9.02575 + 0.86603×3 - 1.5×0.86603/(2×0.5)
    // = 9.02575 + 2.59809 - 1.29905 = 10.3248
    expect(result.measurementOverWires).toBeCloseTo(10.3248, 2);
  });

  it('should use custom wire size', () => {
    const result = threadOverWires({
      majorDiameter: 10,
      pitch: 1.5,
      wireSize: 0.9,
    });

    expect(result.wireSize).toBeCloseTo(0.9, 4);
    // M changes with custom wire size
    expect(result.measurementOverWires).not.toBeCloseTo(
      threadOverWires({ majorDiameter: 10, pitch: 1.5 }).measurementOverWires, 2,
    );
  });

  it('should handle M6×1.0 thread', () => {
    const result = threadOverWires({
      majorDiameter: 6,
      pitch: 1.0,
    });

    // bestWire = 1.0 / √3 = 0.57735
    expect(result.bestWireSize).toBeCloseTo(0.5774, 3);
    // d₂ = 6 - 0.6495 = 5.3505
    expect(result.pitchDiameter).toBeCloseTo(5.3505, 3);
  });

  it('should handle 55° thread angle (Whitworth)', () => {
    const result = threadOverWires({
      majorDiameter: 12.7, // 1/2" BSW
      pitch: 1.0 / 12 * 25.4, // 12 TPI → mm pitch ≈ 2.1167
      threadAngle: 55,
    });

    expect(result.bestWireSize).toBeGreaterThan(0);
    expect(result.measurementOverWires).toBeGreaterThan(result.pitchDiameter);
  });

  it('should handle 29° thread angle (Acme)', () => {
    const result = threadOverWires({
      majorDiameter: 25.4, // 1" Acme
      pitch: 25.4 / 5,    // 5 TPI → 5.08mm pitch
      threadAngle: 29,
    });

    expect(result.bestWireSize).toBeGreaterThan(0);
    expect(result.pitchDiameter).toBeCloseTo(25.4 - 0.5 * 5.08, 2);
  });

  describe('invalid thread parameters (ERRORS.md: throw)', () => {
    it('refuses a non-positive or non-finite diameter, pitch or wire', () => {
      expect(() => threadOverWires({ majorDiameter: -5, pitch: 1 })).toThrow(RangeError);
      expect(() => threadOverWires({ majorDiameter: 0, pitch: 1 })).toThrow(RangeError);
      expect(() => threadOverWires({ majorDiameter: 10, pitch: 0 })).toThrow(RangeError);
      expect(() => threadOverWires({ majorDiameter: 10, pitch: -1 })).toThrow(RangeError);
      expect(() => threadOverWires({ majorDiameter: Number.NaN, pitch: 1 })).toThrow(RangeError);
      expect(() => threadOverWires({ majorDiameter: 10, pitch: 1, wireSize: -1 })).toThrow(RangeError);
      expect(() => threadOverWires({ majorDiameter: 10, pitch: 1, wireSize: 0 })).toThrow(RangeError);
    });

    it('refuses a thread angle it has no pitch-diameter formula for, instead of mixing two forms', () => {
      // 45° used to take the 30° pitch diameter and the 45° wire geometry.
      expect(() => threadOverWires({ majorDiameter: 10, pitch: 1, threadAngle: 45 as never })).toThrow(/threadAngle/);
    });

    it('refuses a pitch so coarse that the pitch diameter would not be positive', () => {
      // 60°: d₂ = 1 − 0.6495 × 2 = −0.299 — no such thread.
      expect(() => threadOverWires({ majorDiameter: 1, pitch: 2 })).toThrow(/too coarse/);
      // Boundary: P = d / 0.6495 gives d₂ = 0; just below it is still a (very coarse) thread.
      expect(() => threadOverWires({ majorDiameter: 6.495, pitch: 10 })).toThrow(/too coarse/);
      expect(threadOverWires({ majorDiameter: 6.495, pitch: 9.99 }).pitchDiameter).toBeGreaterThan(0);
      // Acme / trapezoidal: k = 0.5, so the limit is P = 2d.
      expect(() => threadOverWires({ majorDiameter: 10, pitch: 20, threadAngle: 29 })).toThrow(/too coarse/);
      expect(threadOverWires({ majorDiameter: 10, pitch: 19.9, threadAngle: 30 }).pitchDiameter).toBeCloseTo(0.05, 4);
    });
  });
});

describe('threadOverWires coded refusals', () => {
  it('names the refused input and its bound', () => {
    expect(() => threadOverWires({ majorDiameter: 10, pitch: 1, threadAngle: 45 as never }))
      .toThrow(expect.objectContaining({ code: 'unknown_option', parameter: 'threadAngle', got: '45' }));
    expect(() => threadOverWires({ majorDiameter: 1, pitch: 2 }))
      .toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'pitch', got: 2 }));
  });
});
