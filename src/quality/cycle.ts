import type { CycleTimeInput, CycleTimeResult } from './types.js';
import { requireFinite } from '../utils.js';

/**
 * Calculate Cycle Time statistics
 *
 * Analyzes a set of cycle time measurements and computes statistical metrics.
 *
 * @param input - Cycle time input with measurements array and optional target
 * @returns Statistical analysis results
 * @throws {RangeError} measurements is empty, or a measurement is not greater than 0 (a cycle cannot take zero or negative time)
 */
export function cycleTime(input: CycleTimeInput): CycleTimeResult {
  requireFinite('cycleTime', input);
  const { measurements } = input;

  measurements.forEach((m, i) => {
    if (!(m > 0)) {
      throw new RangeError(`measurements[${i}] must be greater than 0`);
    }
  });

  // No measurements → no statistics; a zero average would read as a measured cycle.
  if (measurements.length === 0) {
    throw new RangeError('measurements must not be empty');
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

  // Coefficient of Variation (CV) in percentage — average > 0 since every measurement is
  const cv = (stdDev / average) * 100;

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
