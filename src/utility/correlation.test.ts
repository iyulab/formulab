import { describe, it, expect } from 'vitest';
import { correlation } from './correlation.js';

describe('correlation', () => {
  it('should calculate perfect positive correlation', () => {
    const result = correlation({ x: [1, 2, 3, 4, 5], y: [2, 4, 6, 8, 10] });
    expect(result).not.toBeNull();
    expect(result!.r).toBeCloseTo(1, 4);
    expect(result!.r2).toBeCloseTo(1, 4);
    expect(result!.n).toBe(5);
  });

  it('should calculate perfect negative correlation', () => {
    const result = correlation({ x: [1, 2, 3, 4, 5], y: [10, 8, 6, 4, 2] });
    expect(result!.r).toBeCloseTo(-1, 4);
    expect(result!.r2).toBeCloseTo(1, 4);
  });

  it('should calculate weak correlation', () => {
    const result = correlation({ x: [1, 2, 3, 4, 5], y: [2, 1, 4, 3, 5] });
    expect(result!.r).toBeGreaterThan(0);
    expect(result!.r).toBeLessThan(1);
  });

  it('should return zero for no correlation', () => {
    const result = correlation({ x: [1, 2, 3, 4, 5], y: [5, 5, 5, 5, 5] });
    expect(result!.r).toBe(0);
  });

  it('should return null for mismatched lengths', () => {
    expect(correlation({ x: [1, 2], y: [1] })).toBeNull();
  });

  it('should return null for single data point', () => {
    expect(correlation({ x: [1], y: [2] })).toBeNull();
  });

  it('should return null for empty arrays', () => {
    expect(correlation({ x: [], y: [] })).toBeNull();
  });
});
