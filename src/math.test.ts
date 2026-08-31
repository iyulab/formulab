import { describe, it, expect } from 'vitest';
import { propagate, fCDF } from './math.js';

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

describe('fCDF', () => {
  it('returns 0 for f <= 0', () => {
    expect(fCDF(0, 5, 10)).toBe(0);
    expect(fCDF(-1, 5, 10)).toBe(0);
  });

  it('returns ~0.5 near the median for symmetric-ish large df', () => {
    // As df1, df2 -> infinity, F -> 1 is the median.
    expect(fCDF(1, 500, 500)).toBeCloseTo(0.5, 2);
  });

  // Cross-checked against standard published F-distribution critical-value tables
  // (upper-tail alpha): P(F <= F_alpha(df1, df2)) must equal 1 - alpha.
  it('matches published F-table critical values (alpha = 0.05)', () => {
    expect(fCDF(4.96, 1, 10)).toBeCloseTo(0.95, 2);
    expect(fCDF(4.46, 2, 8)).toBeCloseTo(0.95, 2);
    expect(fCDF(3.33, 5, 10)).toBeCloseTo(0.95, 2);
  });

  it('matches published F-table critical values (alpha = 0.01)', () => {
    expect(fCDF(10.04, 1, 10)).toBeCloseTo(0.99, 2);
    expect(fCDF(8.65, 2, 8)).toBeCloseTo(0.99, 2);
  });

  it('gives a high CDF (low p-value) for a large F statistic', () => {
    // AIAG MSA ANOVA gage R&R worked example (spcforexcel.com): Part effect F=889.458 (df 4,30).
    expect(fCDF(889.458, 4, 30)).toBeGreaterThan(0.9999);
  });

  it('gives a low CDF (high p-value) for a sub-1 F statistic, matching the source-reported p-value', () => {
    // Same worked example: Operator x Part interaction F=0.142 (df 8,30), reported p=0.9964.
    const p = 1 - fCDF(0.142, 8, 30);
    expect(p).toBeCloseTo(0.9964, 2);
  });
});
