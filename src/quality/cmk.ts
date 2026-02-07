import { roundTo } from '../utils.js';
import type { CmkInput, CmkResult } from './types.js';

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
 * @returns Machine capability indices
 */
export function cmk(input: CmkInput): CmkResult {
  const { measurements, lsl, usl } = input;
  const n = measurements.length;

  if (n === 0) {
    return { mean: 0, stdDev: 0, cm: 0, cmk: 0, isCapable: false };
  }

  // Mean
  const mean = measurements.reduce((s, v) => s + v, 0) / n;

  // Sample standard deviation (guard n=1 → 0/0)
  const variance = n > 1 ? measurements.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);

  if (stdDev <= 0 || !Number.isFinite(stdDev)) {
    return { mean: roundTo(mean, 4), stdDev: 0, cm: 0, cmk: 0, isCapable: false };
  }

  const specWidth = usl - lsl;
  const cm = specWidth / (6 * stdDev);
  const cmkUpper = (usl - mean) / (3 * stdDev);
  const cmkLower = (mean - lsl) / (3 * stdDev);
  const cmkValue = Math.min(cmkUpper, cmkLower);

  return {
    mean: roundTo(mean, 4),
    stdDev: roundTo(stdDev, 4),
    cm: roundTo(cm, 4),
    cmk: roundTo(cmkValue, 4),
    isCapable: cmkValue >= 1.67,
  };
}
