import { describe, it, expect } from 'vitest';
import { percentile } from './percentile.js';

describe('percentile', () => {
  it('should calculate 50th percentile (median)', () => {
    const result = percentile({ data: [1, 2, 3, 4, 5], percentile: 50 });
    expect(result).not.toBeNull();
    expect(result!.value).toBe(3);
  });

  it('should calculate 25th percentile', () => {
    const result = percentile({ data: [1, 2, 3, 4, 5, 6, 7, 8], percentile: 25 });
    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(2.75, 4);
  });

  it('should calculate 75th percentile', () => {
    const result = percentile({ data: [1, 2, 3, 4, 5, 6, 7, 8], percentile: 75 });
    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(6.25, 4);
  });

  it('should return min for 0th percentile', () => {
    const result = percentile({ data: [10, 20, 30], percentile: 0 });
    expect(result!.value).toBe(10);
  });

  it('should return max for 100th percentile', () => {
    const result = percentile({ data: [10, 20, 30], percentile: 100 });
    expect(result!.value).toBe(30);
  });

  it('should return null for empty data', () => {
    expect(percentile({ data: [], percentile: 50 })).toBeNull();
  });

  it('should return null for invalid percentile', () => {
    expect(percentile({ data: [1, 2, 3], percentile: -1 })).toBeNull();
    expect(percentile({ data: [1, 2, 3], percentile: 101 })).toBeNull();
  });

  it('should handle single value', () => {
    const result = percentile({ data: [42], percentile: 50 });
    expect(result!.value).toBe(42);
  });

  it('should handle unsorted input', () => {
    const result = percentile({ data: [5, 1, 3, 2, 4], percentile: 50 });
    expect(result!.value).toBe(3);
  });
});
