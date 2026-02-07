import { describe, it, expect } from 'vitest';
import { regression } from './regression.js';

describe('regression', () => {
  it('should calculate perfect linear relationship', () => {
    const result = regression({ x: [1, 2, 3, 4, 5], y: [2, 4, 6, 8, 10] });
    expect(result).not.toBeNull();
    expect(result!.slope).toBe(2);
    expect(result!.intercept).toBe(0);
    expect(result!.r2).toBeCloseTo(1, 4);
    expect(result!.equation).toBe('y = 2x + 0');
  });

  it('should calculate with intercept', () => {
    const result = regression({ x: [1, 2, 3, 4], y: [3, 5, 7, 9] });
    expect(result!.slope).toBe(2);
    expect(result!.intercept).toBe(1);
    expect(result!.r2).toBeCloseTo(1, 4);
  });

  it('should handle negative slope', () => {
    const result = regression({ x: [1, 2, 3, 4], y: [10, 8, 6, 4] });
    expect(result!.slope).toBe(-2);
    expect(result!.intercept).toBe(12);
    expect(result!.equation).toBe('y = -2x + 12');
  });

  it('should handle negative intercept in equation', () => {
    const result = regression({ x: [1, 2, 3], y: [1, 3, 5] });
    expect(result!.slope).toBe(2);
    expect(result!.intercept).toBe(-1);
    expect(result!.equation).toBe('y = 2x - 1');
  });

  it('should calculate R² for imperfect fit', () => {
    const result = regression({ x: [1, 2, 3, 4, 5], y: [2, 3, 7, 8, 11] });
    expect(result!.r2).toBeGreaterThan(0.9);
    expect(result!.r2).toBeLessThan(1);
  });

  it('should return null for single data point', () => {
    expect(regression({ x: [1], y: [2] })).toBeNull();
  });

  it('should return null for mismatched lengths', () => {
    expect(regression({ x: [1, 2], y: [1] })).toBeNull();
  });

  it('should return null for constant x values', () => {
    expect(regression({ x: [5, 5, 5], y: [1, 2, 3] })).toBeNull();
  });
});
