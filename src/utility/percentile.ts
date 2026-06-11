import { roundTo } from '../utils.js';
import type { PercentileInput, PercentileResult } from './types.js';

/**
 * Calculate a percentile of a data series (linear interpolation between ranks)
 *
 * @param input - Data series and percentile (0-100)
 * @returns Percentile result
 * @throws RangeError if data is empty or percentile is outside [0, 100]
 */
export function percentile(input: PercentileInput): PercentileResult {
  const { data, percentile: p } = input;
  if (!data || data.length === 0) {
    throw new RangeError('data must contain at least one value');
  }
  if (p < 0 || p > 100) {
    throw new RangeError(`percentile must be in [0, 100], got ${p}`);
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  if (p === 0) return { percentile: p, value: sorted[0] };
  if (p === 100) return { percentile: p, value: sorted[n - 1] };

  const rank = (p / 100) * (n - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const frac = rank - lower;

  const value = sorted[lower] + frac * (sorted[upper] - sorted[lower]);

  return {
    percentile: p,
    value: roundTo(value, 6),
  };
}
