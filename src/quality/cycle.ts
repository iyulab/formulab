import type { CycleTimeInput, CycleTimeResult } from './types.js';

/**
 * Calculate Cycle Time statistics
 *
 * Analyzes a set of cycle time measurements and computes statistical metrics.
 *
 * @param input - Cycle time input with measurements array and optional target
 * @returns Statistical analysis results
 */
export function cycleTime(input: CycleTimeInput): CycleTimeResult {
  const { measurements } = input;

  // Handle empty array
  if (measurements.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      range: 0,
      stdDev: 0,
      cv: 0,
    };
  }

  const n = measurements.length;

  // Count
  const count = n;

  // Average (arithmetic mean)
  const sum = measurements.reduce((acc, val) => acc + val, 0);
  const average = sum / n;

  // Min and Max
  const min = Math.min(...measurements);
  const max = Math.max(...measurements);

  // Range
  const range = max - min;

  // Sample Standard Deviation (using n-1 for sample)
  let stdDev = 0;
  if (n > 1) {
    const sumSquaredDiff = measurements.reduce((acc, val) => {
      const diff = val - average;
      return acc + diff * diff;
    }, 0);
    stdDev = Math.sqrt(sumSquaredDiff / (n - 1));
  }

  // Coefficient of Variation (CV) in percentage
  const cv = average > 0 ? (stdDev / average) * 100 : 0;

  return {
    count,
    average,
    min,
    max,
    range,
    stdDev,
    cv,
  };
}
