import { roundTo } from '../utils.js';
import type { NormalizeInput, NormalizeResult } from './types.js';

export function normalize(input: NormalizeInput): NormalizeResult | null {
  const { data, method } = input;
  if (!data || data.length === 0) return null;

  const n = data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const mean = data.reduce((a, v) => a + v, 0) / n;
  const variance = data.reduce((a, v) => a + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  let values: number[];

  if (method === 'min-max') {
    const range = max - min;
    values = range === 0
      ? data.map(() => 0)
      : data.map((v) => roundTo((v - min) / range, 6));
  } else if (method === 'z-score') {
    values = stdDev === 0
      ? data.map(() => 0)
      : data.map((v) => roundTo((v - mean) / stdDev, 6));
  } else {
    return null;
  }

  return {
    values,
    min: roundTo(min, 6),
    max: roundTo(max, 6),
    mean: roundTo(mean, 6),
    stdDev: roundTo(stdDev, 6),
  };
}
