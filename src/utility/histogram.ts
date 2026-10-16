import { roundTo, requireFinite } from '../utils.js';
import { normalCDF } from '../math.js';
import type { HistogramInput, HistogramResult, HistogramBin } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Histogram binning with optional explicit bin count (Sturges' rule by default) and range.
 *
 * @param input - Data values, optional bin count, optional [min, max] range, optional normal distribution
 * @returns Bins with counts/frequencies (and expected normal counts), bin width, and total count
 * @formula expectedNormal = n × (Φ((upper − μ)/σ) − Φ((lower − μ)/σ)); the first bin from −∞, the last to +∞
 * @throws RangeError if data is empty, bins < 1, or a normal distribution's stdDev is not greater than 0
 */
export function histogram(input: HistogramInput): HistogramResult {
  requireFinite('histogram', input);
  const { data } = input;
  if (!data || data.length === 0) {
    throw inputRangeError('data must contain at least one value', { code: 'empty_input', parameter: 'data' });
  }

  const n = data.length;
  if (input.normal && !(input.normal.stdDev > 0)) {
    throw inputRangeError(`normal.stdDev must be greater than 0, got ${input.normal.stdDev}`, {
      code: 'parameter_out_of_range', parameter: 'normal.stdDev', exclusive_min: 0, got: input.normal.stdDev,
    });
  }
  // Sturges' rule for default bin count
  const numBins = input.bins ?? Math.max(1, Math.ceil(Math.log2(n) + 1));
  if (numBins < 1) {
    throw inputRangeError(`bins must be >= 1, got ${numBins}`, {
      code: 'parameter_out_of_range', parameter: 'bins', min: 1, got: numBins,
    });
  }

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

  if (input.normal) {
    const { mean, stdDev } = input.normal;
    // Φ at each bin edge; the outer edges are −∞ and +∞, since the edge bins hold the values
    // clamped into them.
    const edge = (i: number): number =>
      i === 0 ? 0 : i === numBins ? 1 : normalCDF((min + i * binWidth - mean) / stdDev);
    bins.forEach((bin, i) => {
      bin.expectedNormal = roundTo(n * (edge(i + 1) - edge(i)), 4);
    });
  }

  return {
    bins,
    binWidth: roundTo(binWidth, 6),
    totalCount: n,
  };
}
