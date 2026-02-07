import { roundTo } from '../utils.js';
import type { HistogramInput, HistogramResult, HistogramBin } from './types.js';

export function histogram(input: HistogramInput): HistogramResult | null {
  const { data } = input;
  if (!data || data.length === 0) return null;

  const n = data.length;
  // Sturges' rule for default bin count
  const numBins = input.bins ?? Math.max(1, Math.ceil(Math.log2(n) + 1));
  if (numBins < 1) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);

  // Handle case where all values are identical
  const range = max - min;
  const binWidth = range === 0 ? 1 : range / numBins;

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
    let idx = range === 0 ? 0 : Math.floor((value - min) / binWidth);
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
