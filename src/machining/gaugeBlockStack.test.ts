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

  it('should handle target of 0.5mm with the 0.5mm block', () => {
    const result = gaugeBlockStack({ targetDimension: 0.5 });

    expect(result.error).toBeCloseTo(0, 4);
    expect(result.blockCount).toBe(1);
    expect(result.blocks).toContain(0.5);
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

  it('should stack 25.5mm using the 0.5mm block', () => {
    const result = gaugeBlockStack({
      targetDimension: 25.5,
      availableSet: 'metric88',
    });

    expect(result.error).toBeCloseTo(0, 4);
    expect(result.blockCount).toBeGreaterThan(0);
  });

  it('should stack 30.485mm with metric88 exactly', () => {
    const result = gaugeBlockStack({
      targetDimension: 30.485,
      availableSet: 'metric88',
    });

    expect(result.error).toBeCloseTo(0, 3);
    expect(result.blockCount).toBeGreaterThan(0);
  });

  it('should stack 10.5mm exactly', () => {
    const result = gaugeBlockStack({ targetDimension: 10.5 });

    expect(result.error).toBeCloseTo(0, 4);
    expect(result.totalDimension).toBeCloseTo(10.5, 4);
  });

  it('should handle 4dp target by rounding to block-set precision', () => {
    // 25.4567mm → rounds to 25.457 (metric 3dp precision)
    // Optimal: 1.007 + 1.05 + 1.40 + 2 + 20 = 25.457 (metric47)
    // Or: 1.007 + 1.45 + 3 + 20 = 25.457 (metric88)
    const result47 = gaugeBlockStack({ targetDimension: 25.4567 });
    expect(result47.error).toBeLessThan(0.001);

    const result88 = gaugeBlockStack({
      targetDimension: 25.4567,
      availableSet: 'metric88',
    });
    expect(result88.error).toBeLessThan(0.001);
  });

  it('should stack inch target with 4dp precision', () => {
    // Inch sets resolve to 0.0001" precision
    const result = gaugeBlockStack({
      targetDimension: 2.7834,
      availableSet: 'inch81',
    });

    expect(result.error).toBeLessThan(0.001);
    expect(result.blockCount).toBeGreaterThan(0);
  });
});
