import { describe, it, expect } from 'vitest';
import { histogram } from './histogram.js';

describe('histogram', () => {
  it('should create bins with specified count', () => {
    const result = histogram({ data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], bins: 5 });
    expect(result).not.toBeNull();
    expect(result!.bins).toHaveLength(5);
    expect(result!.totalCount).toBe(10);
    expect(result!.binWidth).toBeCloseTo(1.8, 4);
  });

  it('should auto-calculate bin count with Sturges rule', () => {
    const data = Array.from({ length: 100 }, (_, i) => i);
    const result = histogram({ data });
    expect(result).not.toBeNull();
    // Sturges: ceil(log2(100) + 1) = ceil(7.64) = 8
    expect(result!.bins).toHaveLength(8);
  });

  it('should sum frequencies to 1', () => {
    const result = histogram({ data: [1, 2, 2, 3, 3, 3, 4, 4, 5], bins: 4 });
    const totalFreq = result!.bins.reduce((a, b) => a + b.frequency, 0);
    expect(totalFreq).toBeCloseTo(1, 4);
  });

  it('should sum counts to total', () => {
    const data = [10, 20, 20, 30, 30, 30, 40];
    const result = histogram({ data, bins: 3 });
    const totalCount = result!.bins.reduce((a, b) => a + b.count, 0);
    expect(totalCount).toBe(data.length);
  });

  it('should handle single value', () => {
    const result = histogram({ data: [42], bins: 1 });
    expect(result!.bins).toHaveLength(1);
    expect(result!.bins[0].count).toBe(1);
    expect(result!.bins[0].frequency).toBe(1);
  });

  it('should handle identical values', () => {
    const result = histogram({ data: [5, 5, 5, 5], bins: 3 });
    expect(result).not.toBeNull();
    const totalCount = result!.bins.reduce((a, b) => a + b.count, 0);
    expect(totalCount).toBe(4);
  });

  it('should include max value in last bin', () => {
    const result = histogram({ data: [0, 5, 10], bins: 2 });
    const lastBin = result!.bins[result!.bins.length - 1];
    expect(lastBin.count).toBeGreaterThan(0);
  });

  it('should return null for empty data', () => {
    expect(histogram({ data: [] })).toBeNull();
  });

  it('should return null for invalid bins', () => {
    expect(histogram({ data: [1, 2, 3], bins: 0 })).toBeNull();
  });
});
