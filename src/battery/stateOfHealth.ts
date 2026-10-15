import { roundTo, requireFinite } from '../utils.js';
import type { StateOfHealthInput, StateOfHealthResult, SohStatus } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate battery State of Health (SOH)
 *
 * @formula SOH% = (measured / rated) × 100
 * @reference IEEE 1188, IEC 62620
 * @param input - Measured and rated capacity
 * @returns SOH percentage and degradation status
 * @throws {RangeError} ratedCapacityAh is not greater than 0, or measuredCapacityAh is negative
 */
export function stateOfHealth(input: StateOfHealthInput): StateOfHealthResult {
  requireFinite('stateOfHealth', input);
  const { measuredCapacityAh, ratedCapacityAh } = input;

  if (!(ratedCapacityAh > 0)) {
    throw new InputRangeError('ratedCapacityAh must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'ratedCapacityAh', exclusive_min: 0, got: ratedCapacityAh,
    });
  }
  if (!(measuredCapacityAh >= 0)) {
    throw new InputRangeError('measuredCapacityAh must not be negative', {
      code: 'parameter_out_of_range', parameter: 'measuredCapacityAh', min: 0, got: measuredCapacityAh,
    });
  }

  const sohPercent = roundTo((measuredCapacityAh / ratedCapacityAh) * 100, 2);
  const capacityLoss = roundTo(ratedCapacityAh - measuredCapacityAh, 2);
  const capacityLossPercent = roundTo(100 - sohPercent, 2);

  let status: SohStatus;
  if (sohPercent >= 80) {
    status = 'excellent';
  } else if (sohPercent >= 60) {
    status = 'good';
  } else if (sohPercent >= 40) {
    status = 'degraded';
  } else if (sohPercent >= 20) {
    status = 'poor';
  } else {
    status = 'endOfLife';
  }

  return { sohPercent, capacityLoss, capacityLossPercent, status };
}
