import { roundTo } from '../utils.js';
import type { LoadCapacityInput, LoadCapacityResult } from './types.js';

/**
 * Calculate forklift effective load capacity with load center derating.
 *
 * effectiveCapacity = ratedCapacity × (ratedLoadCenter / actualLoadCenter)
 * netCapacity = effectiveCapacity − attachmentLoss
 * utilization = actualLoad / netCapacity × 100
 *
 * @param input - Forklift capacity and load parameters
 * @returns Effective capacity, derating, and utilization metrics
 */
export function loadCapacity(input: LoadCapacityInput): LoadCapacityResult {
  const {
    ratedCapacity,
    ratedLoadCenter,
    actualLoadCenter,
    actualLoad,
    attachmentWeightLoss = 0,
  } = input;

  if (ratedCapacity <= 0 || ratedLoadCenter <= 0 || actualLoadCenter <= 0) {
    return {
      effectiveCapacity: 0,
      loadCenterDerating: 0,
      netCapacity: 0,
      utilization: null,
      isOverloaded: null,
      safetyMargin: null,
    };
  }

  // Derate capacity based on actual vs rated load center
  const effectiveCapacity = ratedCapacity * (ratedLoadCenter / actualLoadCenter);
  const loadCenterDerating = ((ratedCapacity - effectiveCapacity) / ratedCapacity) * 100;

  // Subtract attachment weight loss
  const netCapacity = Math.max(0, effectiveCapacity - attachmentWeightLoss);

  let utilization: number | null = null;
  let isOverloaded: boolean | null = null;
  let safetyMargin: number | null = null;

  if (actualLoad !== undefined) {
    utilization = netCapacity > 0 ? (actualLoad / netCapacity) * 100 : 0;
    isOverloaded = actualLoad > netCapacity;
    safetyMargin = netCapacity - actualLoad;
  }

  return {
    effectiveCapacity: roundTo(effectiveCapacity, 4),
    loadCenterDerating: roundTo(loadCenterDerating, 4),
    netCapacity: roundTo(netCapacity, 4),
    utilization: utilization !== null ? roundTo(utilization, 4) : null,
    isOverloaded,
    safetyMargin: safetyMargin !== null ? roundTo(safetyMargin, 4) : null,
  };
}
