import { roundTo, requireFinite } from '../utils.js';
import type { CRateInput, CRateResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate C-rate ↔ current/time conversion
 *
 * @formula C = I / Ah, time = 1/C hours
 * @param input - Battery capacity with either current or C-rate
 * @returns C-rate, current, and theoretical charge/discharge time
 */
export function cRate(input: CRateInput): CRateResult {
  requireFinite('cRate', input);
  if (input.capacityAh <= 0) {
    throw inputRangeError('capacityAh must be positive', {
      code: 'parameter_out_of_range', parameter: 'capacityAh', exclusive_min: 0, got: input.capacityAh,
    });
  }

  let cRateValue: number;
  let currentA: number;

  if (input.mode === 'currentToRate') {
    if (input.currentA <= 0) {
      throw inputRangeError('currentA must be positive', {
        code: 'parameter_out_of_range', parameter: 'currentA', exclusive_min: 0, got: input.currentA,
      });
    }
    currentA = input.currentA;
    cRateValue = currentA / input.capacityAh;
  } else {
    if (input.cRate <= 0) {
      throw inputRangeError('cRate must be positive', {
        code: 'parameter_out_of_range', parameter: 'cRate', exclusive_min: 0, got: input.cRate,
      });
    }
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
