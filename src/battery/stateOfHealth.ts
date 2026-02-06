import { roundTo } from '../utils.js';
import type { StateOfHealthInput, StateOfHealthResult, SohStatus } from './types.js';

/**
 * Calculate battery State of Health (SOH)
 *
 * @formula SOH% = (measured / rated) × 100
 * @reference IEEE 1188, IEC 62620
 * @param input - Measured and rated capacity
 * @returns SOH percentage and degradation status
 */
export function stateOfHealth(input: StateOfHealthInput): StateOfHealthResult {
  const { measuredCapacityAh, ratedCapacityAh } = input;

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
