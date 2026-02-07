import { describe, it, expect } from 'vitest';
import { statistics } from './statistics.js';

describe('statistics', () => {
  it('should calculate basic statistics', () => {
    const result = statistics({ data: [2, 4, 4, 4, 5, 5, 7, 9] });
    expect(result).not.toBeNull();
    expect(result!.count).toBe(8);
    expect(result!.sum).toBe(40);
    expect(result!.mean).toBe(5);
    expect(result!.median).toBe(4.5);
    expect(result!.min).toBe(2);
    expect(result!.max).toBe(9);
    expect(result!.range).toBe(7);
    expect(result!.variance).toBeCloseTo(4, 4);
    expect(result!.stdDev).toBe(2);
  });

  it('should handle single value', () => {
    const result = statistics({ data: [42] });
    expect(result).not.toBeNull();
    expect(result!.count).toBe(1);
    expect(result!.mean).toBe(42);
    expect(result!.median).toBe(42);
    expect(result!.variance).toBe(0);
    expect(result!.stdDev).toBe(0);
  });

  it('should handle odd number of values for median', () => {
    const result = statistics({ data: [1, 3, 5] });
    expect(result!.median).toBe(3);
  });

  it('should handle even number of values for median', () => {
    const result = statistics({ data: [1, 2, 3, 4] });
    expect(result!.median).toBe(2.5);
  });

  it('should return null for empty data', () => {
    expect(statistics({ data: [] })).toBeNull();
  });

  it('should handle negative values', () => {
    const result = statistics({ data: [-5, -3, 0, 3, 5] });
    expect(result!.mean).toBe(0);
    expect(result!.min).toBe(-5);
    expect(result!.max).toBe(5);
    expect(result!.range).toBe(10);
  });

  it('should handle identical values', () => {
    const result = statistics({ data: [7, 7, 7, 7] });
    expect(result!.mean).toBe(7);
    expect(result!.variance).toBe(0);
    expect(result!.stdDev).toBe(0);
    expect(result!.range).toBe(0);
  });
});
