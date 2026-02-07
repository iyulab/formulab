import { roundTo } from '../utils.js';
import type { CusumInput, CusumResult } from './types.js';

/**
 * CUSUM (Cumulative Sum) Control Chart — Page's Algorithm
 *
 * @formula
 *   - C⁺ₙ = max(0, xₙ − (μ₀ + K) + C⁺ₙ₋₁)
 *   - C⁻ₙ = max(0, (μ₀ − K) − xₙ + C⁻ₙ₋₁)
 *   - Signal when C⁺ or C⁻ > H
 *
 * @reference Page, E.S. (1954). "Continuous inspection schemes"
 * @reference ISO 50001:2018 — CUSUM for energy monitoring
 * @reference Montgomery, D.C. "Introduction to Statistical Quality Control", Ch. 9
 */
export function cusum(input: CusumInput): CusumResult {
  const { values, target } = input;
  const n = values.length;

  if (n === 0) {
    return {
      cusumPositive: [],
      cusumNegative: [],
      signals: [],
      isOutOfControl: false,
      shiftDetected: 'none',
    };
  }

  // Auto-calculate stdDev if not provided
  let sigma = input.stdDev;
  if (sigma == null) {
    const mean = values.reduce((s, v) => s + v, 0) / n;
    sigma = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
    if (!Number.isFinite(sigma) || sigma <= 0) sigma = 1;
  }

  const K = input.allowance ?? sigma / 2;
  const H = input.decisionInterval ?? 5 * sigma;

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
