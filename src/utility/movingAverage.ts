import { roundTo } from '../utils.js';
import type { MovingAverageInput, MovingAverageResult } from './types.js';

export function movingAverage(input: MovingAverageInput): MovingAverageResult | null {
  const { data, window, method } = input;
  if (!data || data.length === 0 || window < 1 || window > data.length) return null;

  if (method === 'sma') {
    return { values: sma(data, window) };
  }
  if (method === 'ema') {
    return { values: ema(data, window) };
  }
  return null;
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
