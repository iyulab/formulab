import { describe, it, expect } from 'vitest';
import { gaugeBlockStack } from './gaugeBlockStack.js';

describe('gaugeBlockStack', () => {
  it('should build stack for a simple whole number', () => {
    const result = gaugeBlockStack({ targetDimension: 25 });

    expect(result.error).toBeCloseTo(0, 4);
    expect(result.totalDimension).toBeCloseTo(25, 4);
    expect(result.blockCount).toBeGreaterThan(0);
    expect(result.blockCount).toBeLessThanOrEqual(5);
  });

  it('should build stack for 37.485mm', () => {
    const result = gaugeBlockStack({ targetDimension: 37.485 });

    expect(result.error).toBeCloseTo(0, 3);
    expect(result.totalDimension).toBeCloseTo(37.485, 3);
    expect(result.blockCount).toBeLessThanOrEqual(6);
  });

  it('should return blocks sorted largest first', () => {
    const result = gaugeBlockStack({ targetDimension: 52.375 });

    for (let i = 0; i < result.blocks.length - 1; i++) {
      expect(result.blocks[i]).toBeGreaterThanOrEqual(result.blocks[i + 1]);
    }
  });

  it('should handle target smaller than any single block', () => {
    const result = gaugeBlockStack({ targetDimension: 0.5 });

    // Can't build exactly 0.5 from standard set
    expect(result.blockCount).toBe(0);
  });

  it('should use metric88 set when specified', () => {
    const result = gaugeBlockStack({
      targetDimension: 27.345,
      availableSet: 'metric88',
    });

    expect(result.error).toBeCloseTo(0, 3);
    expect(result.blockCount).toBeLessThanOrEqual(5);
  });

  it('should not use same block twice', () => {
    const result = gaugeBlockStack({ targetDimension: 50 });

    const unique = new Set(result.blocks);
    expect(unique.size).toBe(result.blockCount);
  });
});
