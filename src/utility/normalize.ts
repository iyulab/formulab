import { roundTo } from '../utils.js';
import type { NormalizeInput, NormalizeResult } from './types.js';

/**
 * Normalize a data series via min-max scaling or z-score standardization
 *
 * @param input - Data series and method ('min-max' | 'z-score')
 * @returns Normalized values with min/max/mean/stdDev metadata
 * @throws RangeError if data is empty or method is not 'min-max' or 'z-score'
 */
export function normalize(input: NormalizeInput): NormalizeResult {
  const { data, method } = input;
  if (!data || data.length === 0) {
    throw new RangeError('data must contain at least one value');
  }

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
    throw new RangeError(`method must be 'min-max' or 'z-score', got ${String(method)}`);
  }

  return {
    values,
    min: roundTo(min, 6),
    max: roundTo(max, 6),
    mean: roundTo(mean, 6),
    stdDev: roundTo(stdDev, 6),
  };
}
