import { roundTo } from '../utils.js';
import type { HistogramInput, HistogramResult, HistogramBin } from './types.js';

export function histogram(input: HistogramInput): HistogramResult | null {
  const { data } = input;
  if (!data || data.length === 0) return null;

  const n = data.length;
  // Sturges' rule for default bin count
  const numBins = input.bins ?? Math.max(1, Math.ceil(Math.log2(n) + 1));
  if (numBins < 1) return null;

  // Use explicit range when provided and valid; fall back to data-derived min/max
  let min: number;
  let max: number;
  if (input.range && input.range[1] > input.range[0]) {
    min = input.range[0];
    max = input.range[1];
  } else {
    min = Math.min(...data);
    max = Math.max(...data);
  }

  // Handle case where all values are identical
  const span = max - min;
  const binWidth = span === 0 ? 1 : span / numBins;

  const bins: HistogramBin[] = [];
  for (let i = 0; i < numBins; i++) {
    const lower = min + i * binWidth;
    const upper = min + (i + 1) * binWidth;
    bins.push({
      lower: roundTo(lower, 6),
      upper: roundTo(upper, 6),
      count: 0,
      frequency: 0,
    });
  }

  for (const value of data) {
    let idx = span === 0 ? 0 : Math.floor((value - min) / binWidth);
    if (idx < 0) idx = 0; // clamp values below min into first bin
    if (idx >= numBins) idx = numBins - 1; // include max in last bin
    bins[idx].count++;
  }

  for (const bin of bins) {
    bin.frequency = roundTo(bin.count / n, 6);
  }

  return {
    bins,
    binWidth: roundTo(binWidth, 6),
    totalCount: n,
  };
}
