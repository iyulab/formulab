import { roundTo } from '../utils.js';
import type { CRateInput, CRateResult } from './types.js';

/**
 * Calculate C-rate ↔ current/time conversion
 *
 * @formula C = I / Ah, time = 1/C hours
 * @param input - Battery capacity with either current or C-rate
 * @returns C-rate, current, and theoretical charge/discharge time
 */
export function cRate(input: CRateInput): CRateResult {
  let cRateValue: number;
  let currentA: number;

  if (input.mode === 'currentToRate') {
    currentA = input.currentA;
    cRateValue = currentA / input.capacityAh;
  } else {
    cRateValue = input.cRate;
    currentA = cRateValue * input.capacityAh;
  }

  const theoreticalTimeH = 1 / cRateValue;
  const theoreticalTimeMin = theoreticalTimeH * 60;

  return {
    cRate: roundTo(cRateValue, 4),
    currentA: roundTo(currentA, 2),
    theoreticalTimeH: roundTo(theoreticalTimeH, 2),
    theoreticalTimeMin: roundTo(theoreticalTimeMin, 1),
  };
}
