import { roundTo } from '../utils.js';
import type { MovingAverageInput, MovingAverageResult } from './types.js';

/**
 * Calculate moving average (simple or exponential) over a data series
 *
 * @param input - Data series, window size, and method ('sma' | 'ema')
 * @returns Moving average values
 * @throws RangeError if data is empty, window is less than 1,
 *   window exceeds data length, or method is not 'sma' or 'ema'
 */
export function movingAverage(input: MovingAverageInput): MovingAverageResult {
  const { data, window, method } = input;
  if (!data || data.length === 0) {
    throw new RangeError('data must contain at least one value');
  }
  if (window < 1) {
    throw new RangeError(`window must be >= 1, got ${window}`);
  }
  if (window > data.length) {
    throw new RangeError(`window must be <= data length (${data.length}), got ${window}`);
  }

  if (method === 'sma') {
    return { values: sma(data, window) };
  }
  if (method === 'ema') {
    return { values: ema(data, window) };
  }
  throw new RangeError(`method must be 'sma' or 'ema', got ${String(method)}`);
}

function sma(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = window - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) {
      sum += data[j];
    }
    result.push(roundTo(sum / window, 6));
  }
  return result;
}

function ema(data: number[], window: number): number[] {
  const k = 2 / (window + 1);
  const result: number[] = [];

  // First EMA value is SMA of first window
  let sum = 0;
  for (let i = 0; i < window; i++) {
    sum += data[i];
  }
  let prev = sum / window;
  result.push(roundTo(prev, 6));

  for (let i = window; i < data.length; i++) {
    prev = data[i] * k + prev * (1 - k);
    result.push(roundTo(prev, 6));
  }
  return result;
}
