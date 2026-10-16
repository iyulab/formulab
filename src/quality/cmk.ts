import { roundTo, requireFinite } from '../utils.js';
import { capabilityIndices } from './capability.js';
import type { CmkInput, CmkResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate Cmk (Machine Capability Index)
 *
 * @formula
 *   - Cm  = (USL - LSL) / (6σ)
 *   - Cmk = min((USL - x̄) / (3σ), (x̄ - LSL) / (3σ))
 *   - Threshold: Cmk ≥ 1.67 (stricter than Cpk ≥ 1.33)
 *
 * @reference VDA 5 — Measurement System Analysis
 * @reference ISO 22514-3:2020 — Machine performance studies
 *
 * @param input - Raw measurements and specification limits
 * @returns Machine capability indices — `cm`, `cmk` and `isCapable` are `null` when the
 *   measurements do not vary (σ = 0)
 * @throws {RangeError} fewer than 2 measurements, a measurement that is not finite, or usl not
 *   greater than lsl
 */
export function cmk(input: CmkInput): CmkResult {
  requireFinite('cmk', input);
  const { measurements, lsl, usl } = input;
  const n = measurements.length;

  // A sample standard deviation needs two readings; with fewer there is no study to report.
  if (n < 2) {
    throw inputRangeError('measurements must contain at least 2 values', {
      code: 'insufficient_data', parameter: 'measurements', min: 2, got: n,
    });
  }

  const mean = measurements.reduce((s, v) => s + v, 0) / n;
  const stdDev = Math.sqrt(measurements.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
  const c = capabilityIndices(usl, lsl, mean, stdDev);

  return {
    mean: roundTo(mean, 4),
    stdDev: roundTo(stdDev, 4),
    cm: c.spread,
    cmk: c.index,
    isCapable: c.index === null ? null : c.index >= 1.67,
  };
}
