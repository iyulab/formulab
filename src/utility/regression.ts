import { roundTo } from '../utils.js';
import type { RegressionInput, RegressionResult } from './types.js';

export function regression(input: RegressionInput): RegressionResult | null {
  const { x, y } = input;
  if (!x || !y || x.length !== y.length || x.length < 2) return null;

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

  if (sumX2 === 0) return null;

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
