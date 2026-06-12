import { roundTo } from '../utils.js';
import type { StatisticsInput, StatisticsResult } from './types.js';

/**
 * Descriptive statistics (count, sum, mean, median, min, max, range, variance, stdDev)
 *
 * `variance`/`stdDev` are population statistics (divisor n);
 * `sampleVariance`/`sampleStdDev` use Bessel's correction (divisor n−1)
 * and are undefined when the data set has fewer than 2 values.
 *
 * @param input - Statistics input with data array
 * @returns Descriptive statistics for the data set
 * @throws RangeError if data is missing or empty
 */
export function statistics(input: StatisticsInput): StatisticsResult {
  const { data } = input;
  if (!data || data.length === 0) {
    throw new RangeError('data must contain at least 1 value');
  }

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

  const sumSquaredDev = data.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  const variance = sumSquaredDev / n;
  const stdDev = Math.sqrt(variance);
  const sampleVariance = n >= 2 ? sumSquaredDev / (n - 1) : undefined;
  const sampleStdDev = sampleVariance !== undefined ? Math.sqrt(sampleVariance) : undefined;

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
    sampleVariance: sampleVariance !== undefined ? roundTo(sampleVariance, 6) : undefined,
    sampleStdDev: sampleStdDev !== undefined ? roundTo(sampleStdDev, 6) : undefined,
  };
}
