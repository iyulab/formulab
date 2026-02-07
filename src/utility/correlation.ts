import { roundTo } from '../utils.js';
import type { CorrelationInput, CorrelationResult } from './types.js';

export function correlation(input: CorrelationInput): CorrelationResult | null {
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

  const denom = Math.sqrt(sumX2 * sumY2);
  if (denom === 0) return { r: 0, r2: 0, n };

  const r = sumXY / denom;

  return {
    r: roundTo(r, 6),
    r2: roundTo(r * r, 6),
    n,
  };
}
