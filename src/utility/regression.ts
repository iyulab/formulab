import { roundTo } from '../utils.js';
import type { RegressionInput, RegressionResult } from './types.js';

/**
 * Simple linear regression (least squares)
 *
 * @param input - Regression input with x and y data arrays
 * @returns Slope, intercept, R² and equation string
 * @throws RangeError if x or y is missing, if x and y lengths differ,
 *   if fewer than 2 data points are provided, or if all x values are identical
 */
export function regression(input: RegressionInput): RegressionResult {
  const { x, y } = input;
  if (!x || !y) {
    throw new RangeError('x and y data arrays are required');
  }
  if (x.length !== y.length) {
    throw new RangeError(`x and y must have the same length, got ${x.length} and ${y.length}`);
  }
  if (x.length < 2) {
    throw new RangeError(`at least 2 data points are required, got ${x.length}`);
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

  if (sumX2 === 0) {
    throw new RangeError('x values must not all be identical (zero variance in x)');
  }

  const slope = sumXY / sumX2;
  const intercept = meanY - slope * meanX;

  const ssTot = sumY2;
  const ssRes = y.reduce((acc, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return acc + (yi - predicted) ** 2;
  }, 0);
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  const slopeStr = roundTo(slope, 6);
  const interceptStr = roundTo(intercept, 6);
  const sign = interceptStr >= 0 ? '+' : '-';
  const equation = `y = ${slopeStr}x ${sign} ${Math.abs(interceptStr)}`;

  return {
    slope: roundTo(slope, 6),
    intercept: roundTo(intercept, 6),
    r2: roundTo(r2, 6),
    equation,
  };
}
