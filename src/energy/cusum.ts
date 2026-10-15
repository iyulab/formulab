import { roundTo, requireFinite } from '../utils.js';
import type { CusumInput, CusumResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * CUSUM (Cumulative Sum) Control Chart — Page's Algorithm
 *
 * @formula
 *   - C⁺ₙ = max(0, xₙ − (μ₀ + K) + C⁺ₙ₋₁)
 *   - C⁻ₙ = max(0, (μ₀ − K) − xₙ + C⁻ₙ₋₁)
 *   - Signal when C⁺ or C⁻ > H
 *
 * Default K = σ/2 and H = 5σ match ISO 7870-4:2011's own recommended allowance factor
 * f = 0,5 and decision-interval factor h = 5 (i.e. K = f·σ, H = h·σ) — read directly
 * from the standard, not carried over from a secondary source.
 *
 * @reference ISO 7870-4:2011, Control charts — Part 4: Cumulative sum charts.
 * @reference Page, E.S. (1954). "Continuous inspection schemes"
 * @reference ISO 50001:2018 — CUSUM for energy monitoring
 * @reference Montgomery, D.C. "Introduction to Statistical Quality Control", Ch. 9
 *
 * @throws {RangeError} values is empty; a given allowance is negative or decisionInterval is not
 *   greater than 0; a given stdDev is not greater than 0; or σ is needed (allowance
 *   or decisionInterval omitted) and cannot be estimated because there are fewer than 2 values or they
 *   are all equal
 */
export function cusum(input: CusumInput): CusumResult {
  requireFinite('cusum', input);
  const { values, target } = input;
  const n = values.length;

  // No readings → no chart; an empty «in control» result would read as a verdict.
  if (n === 0) {
    throw new RangeError('values must not be empty');
  }

  // A negative allowance widens nothing — it makes C⁺ and C⁻ grow on target data; a decision
  // interval ≤ 0 signals on the first reading.
  if (input.allowance != null && !(input.allowance >= 0)) {
    throw inputRangeError('allowance must not be negative', {
      code: 'parameter_out_of_range', parameter: 'allowance', min: 0, got: input.allowance,
    });
  }
  if (input.decisionInterval != null && !(input.decisionInterval > 0)) {
    throw inputRangeError('decisionInterval must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'decisionInterval', exclusive_min: 0, got: input.decisionInterval,
    });
  }

  // K and H are multiples of σ unless both are given. An auto σ needs data that varies:
  // substituting σ = 1 (in whatever unit the readings are) would set the decision interval
  // at random.
  let K = input.allowance;
  let H = input.decisionInterval;
  if (K == null || H == null) {
    let sigma = input.stdDev;
    if (sigma == null) {
      const mean = values.reduce((s, v) => s + v, 0) / n;
      sigma = n > 1 ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1)) : 0;
      if (!(sigma > 0) || !Number.isFinite(sigma)) {
        throw inputRangeError('stdDev cannot be estimated from these values (fewer than 2, or all equal) — give stdDev, or both allowance and decisionInterval', {
          code: 'parameter_out_of_range', parameter: 'sigma', exclusive_min: 0, got: sigma,
        });
      }
    } else if (!(sigma > 0) || !Number.isFinite(sigma)) {
      throw inputRangeError('stdDev must be greater than 0', {
        code: 'parameter_out_of_range', parameter: 'stdDev', exclusive_min: 0, got: sigma,
      });
    }
    K ??= sigma / 2;
    H ??= 5 * sigma;
  }

  const cusumPositive: number[] = [];
  const cusumNegative: number[] = [];
  const signals: number[] = [];
  let hasPositiveSignal = false;
  let hasNegativeSignal = false;

  let cPlus = 0;
  let cMinus = 0;

  for (let i = 0; i < n; i++) {
    cPlus = Math.max(0, values[i] - (target + K) + cPlus);
    cMinus = Math.max(0, (target - K) - values[i] + cMinus);

    cusumPositive.push(roundTo(cPlus, 4));
    cusumNegative.push(roundTo(cMinus, 4));

    if (cPlus > H || cMinus > H) {
      signals.push(i);
      if (cPlus > H) hasPositiveSignal = true;
      if (cMinus > H) hasNegativeSignal = true;
    }
  }

  let shiftDetected: CusumResult['shiftDetected'] = 'none';
  if (hasPositiveSignal && hasNegativeSignal) shiftDetected = 'both';
  else if (hasPositiveSignal) shiftDetected = 'positive';
  else if (hasNegativeSignal) shiftDetected = 'negative';

  return {
    cusumPositive,
    cusumNegative,
    signals,
    isOutOfControl: signals.length > 0,
    shiftDetected,
  };
}
