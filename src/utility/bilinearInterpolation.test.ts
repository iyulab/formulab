import { describe, it, expect } from 'vitest';
import { bilinearInterpolation } from './bilinearInterpolation.js';

describe('bilinearInterpolation', () => {
  const table = {
    x: [0, 10],
    y: [0, 10],
    z: [
      [0, 10],
      [10, 20],
    ],
  };

  it('should interpolate at center', () => {
    const result = bilinearInterpolation({ ...table, targetX: 5, targetY: 5 });
    expect(result).not.toBeNull();
    expect(result!.value).toBe(10); // average of 0,10,10,20
    expect(result!.isExtrapolation).toBe(false);
  });

  it('should return corner value', () => {
    const result = bilinearInterpolation({ ...table, targetX: 0, targetY: 0 });
    expect(result!.value).toBe(0);
  });

  it('should interpolate along x edge', () => {
    const result = bilinearInterpolation({ ...table, targetX: 5, targetY: 0 });
    expect(result!.value).toBe(5); // midpoint of 0 and 10
  });

  it('should interpolate along y edge', () => {
    const result = bilinearInterpolation({ ...table, targetX: 0, targetY: 5 });
    expect(result!.value).toBe(5); // midpoint of 0 and 10
  });

  it('should handle larger grid', () => {
    const result = bilinearInterpolation({
      x: [100, 200, 300],
      y: [10, 20, 30],
      z: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      targetX: 150,
      targetY: 15,
    });
    expect(result!.value).toBe(3); // bilinear of 1,2,4,5
    expect(result!.isExtrapolation).toBe(false);
  });

  it('should detect extrapolation', () => {
    const result = bilinearInterpolation({ ...table, targetX: -5, targetY: 5 });
    expect(result!.isExtrapolation).toBe(true);
  });

  it('should return null for insufficient x points', () => {
    expect(bilinearInterpolation({
      x: [0], y: [0, 10], z: [[0, 10]], targetX: 0, targetY: 5,
    })).toBeNull();
  });

  it('should return null for mismatched z dimensions', () => {
    expect(bilinearInterpolation({
      x: [0, 10], y: [0, 10], z: [[0, 10]], targetX: 5, targetY: 5,
    })).toBeNull();
  });

  it('should return null for mismatched row length in z', () => {
    expect(bilinearInterpolation({
      x: [0, 10], y: [0, 10], z: [[0], [10, 20]], targetX: 5, targetY: 5,
    })).toBeNull();
  });
});
