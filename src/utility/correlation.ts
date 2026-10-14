import { roundTo, requireFinite } from '../utils.js';
import type { CorrelationInput, CorrelationResult } from './types.js';

/**
 * Pearson correlation coefficient between two equal-length samples.
 *
 * @param input - Paired samples x and y
 * @returns Correlation coefficient r, r-squared, and sample size n
 * @throws RangeError if x and y lengths differ or contain fewer than 2 points
 * @remarks For valid input where one variable has zero variance (constant data),
 * the Pearson denominator is 0 and correlation is undefined; `r` and `r2` are `null`.
 * A 0 would state «no linear relation», which constant data does not show either way.
 */
export function correlation(input: CorrelationInput): CorrelationResult {
  requireFinite('correlation', input);
  const { x, y } = input;
  if (!x || !y || x.length !== y.length) {
    throw new RangeError(`x and y must have the same length, got ${x?.length ?? 0} and ${y?.length ?? 0}`);
  }
  if (x.length < 2) {
    throw new RangeError(`x and y must contain at least 2 points, got ${x.length}`);
  }

  const n = x.length;
  const meanX = x.reduce((a, v) => a + v, 0) / n;
  const meanY = y.reduce((a, v) => a + v, 0) / n;

  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumXY += dx * dy;
    sumX2 += dx * dx;
    sumY2 += dy * dy;
  }

  const denom = Math.sqrt(sumX2 * sumY2);
  // Constant data has no correlation — r = 0 would read as «no linear relation».
  if (denom === 0) return { r: null, r2: null, n };

  const r = sumXY / denom;

  return {
    r: roundTo(r, 6),
    r2: roundTo(r * r, 6),
    n,
  };
}
