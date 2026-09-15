import { roundTo } from '../utils.js';
import type { LoadCapacityInput, LoadCapacityResult } from './types.js';

/**
 * Calculate forklift effective load capacity with load center derating.
 *
 * effectiveCapacity = ratedCapacity × min(1, ratedLoadCenter / actualLoadCenter)
 * netCapacity = max(0, effectiveCapacity − attachmentLoss)
 * utilization = actualLoad / netCapacity × 100
 *
 * @reference OSHA Powered Industrial Trucks eTool — the data plate capacity at its rated load center
 *   is the truck's maximum; a load whose center of gravity is farther out reduces it.
 *
 * @param input - Forklift capacity and load parameters
 * @returns Effective capacity, derating, and utilization metrics, plus the parts that take the rated
 *   capacity down to the net capacity (`ratedCapacity − loadCenterLoss − attachmentWeightLoss`, before
 *   the zero floor).
 * @throws {RangeError} attachmentWeightLoss or actualLoad is negative.
 * @remarks Non-positive rated capacity or load-center inputs return a zeroed result (legacy sentinel).
 *   Two boundary substitutions are disclosed rather than silent: a load center shorter than rated keeps
 *   the rated capacity (`capacityCappedAtRated`) — the moment ratio would exceed the nameplate — and an
 *   attachment heavier than the derated capacity floors the net capacity at 0 (`netCapacityClamped`).
 */
export function loadCapacity(input: LoadCapacityInput): LoadCapacityResult {
  const {
    ratedCapacity,
    ratedLoadCenter,
    actualLoadCenter,
    actualLoad,
    attachmentWeightLoss = 0,
  } = input;

  if (attachmentWeightLoss < 0) {
    throw new RangeError('attachmentWeightLoss must not be negative');
  }
  if (actualLoad !== undefined && actualLoad < 0) {
    throw new RangeError('actualLoad must not be negative');
  }

  if (ratedCapacity <= 0 || ratedLoadCenter <= 0 || actualLoadCenter <= 0) {
    return {
      ratedCapacity: 0,
      effectiveCapacity: 0,
      loadCenterDerating: 0,
      loadCenterLoss: 0,
      capacityCappedAtRated: false,
      attachmentWeightLoss: 0,
      netCapacity: 0,
      netCapacityClamped: false,
      utilization: null,
      isOverloaded: null,
      safetyMargin: null,
    };
  }

  // Derate capacity for a load center beyond the rated one; never exceed the nameplate capacity
  const capacityCappedAtRated = actualLoadCenter < ratedLoadCenter;
  const effectiveCapacity = ratedCapacity * Math.min(1, ratedLoadCenter / actualLoadCenter);
  const loadCenterLoss = ratedCapacity - effectiveCapacity;
  const loadCenterDerating = (loadCenterLoss / ratedCapacity) * 100;

  // Subtract attachment weight loss
  const netCapacityClamped = effectiveCapacity - attachmentWeightLoss < 0;
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
    ratedCapacity,
    effectiveCapacity: roundTo(effectiveCapacity, 4),
    loadCenterDerating: roundTo(loadCenterDerating, 4),
    loadCenterLoss: roundTo(loadCenterLoss, 4),
    capacityCappedAtRated,
    attachmentWeightLoss,
    netCapacity: roundTo(netCapacity, 4),
    netCapacityClamped,
    utilization: utilization !== null ? roundTo(utilization, 4) : null,
    isOverloaded,
    safetyMargin: safetyMargin !== null ? roundTo(safetyMargin, 4) : null,
  };
}
