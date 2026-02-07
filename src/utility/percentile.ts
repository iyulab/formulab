import { roundTo } from '../utils.js';
import type { PercentileInput, PercentileResult } from './types.js';

export function percentile(input: PercentileInput): PercentileResult | null {
  const { data, percentile: p } = input;
  if (!data || data.length === 0) return null;
  if (p < 0 || p > 100) return null;

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
