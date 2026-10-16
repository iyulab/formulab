import { describe, it, expect } from 'vitest';
import { regression } from './regression.js';

describe('regression', () => {
  it('should calculate perfect linear relationship', () => {
    const result = regression({ x: [1, 2, 3, 4, 5], y: [2, 4, 6, 8, 10] });
    expect(result).not.toBeNull();
    expect(result.slope).toBe(2);
    expect(result.intercept).toBe(0);
    expect(result.r2).toBeCloseTo(1, 4);
    expect(result).toMatchObject({ slope: 2, intercept: 0 });
  });

  it('should calculate with intercept', () => {
    const result = regression({ x: [1, 2, 3, 4], y: [3, 5, 7, 9] });
    expect(result.slope).toBe(2);
    expect(result.intercept).toBe(1);
    expect(result.r2).toBeCloseTo(1, 4);
  });

  it('should handle negative slope', () => {
    const result = regression({ x: [1, 2, 3, 4], y: [10, 8, 6, 4] });
    expect(result.slope).toBe(-2);
    expect(result.intercept).toBe(12);
    expect(result).toMatchObject({ slope: -2, intercept: 12 });
  });

  it('should handle a negative intercept', () => {
    const result = regression({ x: [1, 2, 3], y: [1, 3, 5] });
    expect(result.slope).toBe(2);
    expect(result.intercept).toBe(-1);
    expect(result).toMatchObject({ slope: 2, intercept: -1 });
  });

  it('should calculate R² for imperfect fit', () => {
    const result = regression({ x: [1, 2, 3, 4, 5], y: [2, 3, 7, 8, 11] });
    expect(result.r2).toBeGreaterThan(0.9);
    expect(result.r2).toBeLessThan(1);
  });

  it('should throw RangeError for single data point', () => {
    expect(() => regression({ x: [1], y: [2] })).toThrow(RangeError);
  });

  it('should throw RangeError for mismatched lengths', () => {
    expect(() => regression({ x: [1, 2], y: [1] })).toThrow(RangeError);
  });

  it('should throw RangeError for constant x values', () => {
    expect(() => regression({ x: [5, 5, 5], y: [1, 2, 3] })).toThrow(RangeError);
  });
});

describe('regression refusal codes', () => {
  it('codes missing and unequal-length arrays', () => {
    expect(() => regression({ x: undefined as never, y: [1, 2] })).toThrow(expect.objectContaining({ code: 'missing_option', parameter: 'x' }));
    expect(() => regression({ x: [1, 2], y: undefined as never })).toThrow(expect.objectContaining({ code: 'missing_option', parameter: 'y' }));
    expect(() => regression({ x: [1, 2, 3], y: [1, 2] })).toThrow(expect.objectContaining({ code: 'dimension_mismatch', parameter: 'y', expected: 3, got: 2 }));
  });
});
