import { describe, it, expect } from 'vitest';
import { linearInterpolation } from './linearInterpolation.js';

describe('linearInterpolation', () => {
  const table = {
    x: [0, 10, 20, 30, 40],
    y: [0, 100, 180, 240, 280],
  };

  it('should interpolate between known points', () => {
    const result = linearInterpolation({ ...table, target: 15 });
    expect(result).not.toBeNull();
    expect(result!.value).toBe(140); // midpoint of 100 and 180
    expect(result!.isExtrapolation).toBe(false);
    expect(result!.lowerIndex).toBe(1);
    expect(result!.upperIndex).toBe(2);
  });

  it('should return exact value at known point', () => {
    const result = linearInterpolation({ ...table, target: 20 });
    expect(result!.value).toBe(180);
    expect(result!.isExtrapolation).toBe(false);
  });

  it('should interpolate at first interval', () => {
    const result = linearInterpolation({ ...table, target: 5 });
    expect(result!.value).toBe(50);
  });

  it('should interpolate at last interval', () => {
    const result = linearInterpolation({ ...table, target: 35 });
    expect(result!.value).toBe(260); // midpoint of 240 and 280
  });

  it('should extrapolate below range', () => {
    const result = linearInterpolation({ ...table, target: -5 });
    expect(result!.value).toBe(-50);
    expect(result!.isExtrapolation).toBe(true);
  });

  it('should extrapolate above range', () => {
    const result = linearInterpolation({ ...table, target: 50 });
    expect(result!.value).toBe(320);
    expect(result!.isExtrapolation).toBe(true);
  });

  it('should handle two-point table', () => {
    const result = linearInterpolation({
      x: [0, 100],
      y: [32, 212],
      target: 50,
    });
    expect(result!.value).toBe(122);
  });

  it('should return null for mismatched arrays', () => {
    expect(linearInterpolation({ x: [1, 2], y: [1], target: 1.5 })).toBeNull();
  });

  it('should return null for single point', () => {
    expect(linearInterpolation({ x: [1], y: [1], target: 1 })).toBeNull();
  });

  it('should return null for empty arrays', () => {
    expect(linearInterpolation({ x: [], y: [], target: 1 })).toBeNull();
  });
});
