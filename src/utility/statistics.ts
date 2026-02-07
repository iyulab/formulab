import { roundTo } from '../utils.js';
import type { StatisticsInput, StatisticsResult } from './types.js';

export function statistics(input: StatisticsInput): StatisticsResult | null {
  const { data } = input;
  if (!data || data.length === 0) return null;

  const n = data.length;
  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  let median: number;
  if (n % 2 === 0) {
    median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  } else {
    median = sorted[Math.floor(n / 2)];
  }

  const variance = data.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    count: n,
    sum: roundTo(sum, 6),
    mean: roundTo(mean, 6),
    median: roundTo(median, 6),
    min: roundTo(min, 6),
    max: roundTo(max, 6),
    range: roundTo(range, 6),
    variance: roundTo(variance, 6),
    stdDev: roundTo(stdDev, 6),
  };
}
