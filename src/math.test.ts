import { describe, it, expect } from 'vitest';
import { propagate } from './math.js';

describe('propagate', () => {
  it('returns the nominal value unperturbed', () => {
    const result = propagate(
      { a: 2, b: 3 },
      { a: 0.1 },
      (input: { a: number; b: number }) => input.a + input.b,
      (out) => out,
    );
    expect(result.value).toBe(5);
  });

  it('brackets a monotonic-increasing function exactly (single uncertain input)', () => {
    const result = propagate(
      { x: 10 },
      { x: 1 },
      (input: { x: number }) => input.x * 2,
      (out) => out,
    );
    expect(result.value).toBe(20);
    expect(result.min).toBe(18);
    expect(result.max).toBe(22);
  });

  it('brackets a monotonic-decreasing function exactly', () => {
    const result = propagate(
      { x: 10 },
      { x: 1 },
      (input: { x: number }) => 100 - input.x,
      (out) => out,
    );
    expect(result.min).toBe(89);
    expect(result.max).toBe(91);
  });

  it('evaluates all corners for multiple uncertain inputs (2^n), not just extremes summed', () => {
    // x*y is not linear -- the true max/min over a box isn't simply
    // "push every input its own worst direction independently" the way
    // a linear function allows; propagate must actually evaluate the
    // corners rather than assume separability.
    const result = propagate(
      { x: 10, y: 10 },
      { x: 2, y: 2 },
      (input: { x: number; y: number }) => input.x * input.y,
      (out) => out,
    );
    // Corners: 8*8=64, 8*12=96, 12*8=96, 12*12=144
    expect(result.min).toBe(64);
    expect(result.max).toBe(144);
    expect(result.value).toBe(100);
  });

  it('leaves inputs with no listed uncertainty untouched', () => {
    const result = propagate(
      { x: 5, fixed: 1000 },
      { x: 1 },
      (input: { x: number; fixed: number }) => input.x + input.fixed,
      (out) => out,
    );
    expect(result.min).toBe(1004);
    expect(result.max).toBe(1006);
  });

  it('handles zero uncertain inputs (empty uncertainty map) as a no-op range', () => {
    const result = propagate(
      { x: 5 },
      {},
      (input: { x: number }) => input.x * 3,
      (out) => out,
    );
    expect(result.value).toBe(15);
    expect(result.min).toBe(15);
    expect(result.max).toBe(15);
  });
});
