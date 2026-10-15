import { roundTo, requireFinite } from '../utils.js';
import type { LoadCapacityInput, LoadCapacityResult } from './types.js';
import { InputRangeError } from '../errors.js';

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
 * @throws {RangeError} ratedCapacity, ratedLoadCenter or actualLoadCenter is not greater than 0, or
 *   attachmentWeightLoss or actualLoad is negative.
 * @remarks Two boundary substitutions are disclosed rather than silent: a load center shorter than rated keeps
 *   the rated capacity (`capacityCappedAtRated`) — the moment ratio would exceed the nameplate — and an
 *   attachment heavier than the derated capacity floors the net capacity at 0 (`netCapacityClamped`).
 */
export function loadCapacity(input: LoadCapacityInput): LoadCapacityResult {
  requireFinite('loadCapacity', input);
  const {
    ratedCapacity,
    ratedLoadCenter,
    actualLoadCenter,
    actualLoad,
    attachmentWeightLoss = 0,
  } = input;

  // The derating is a ratio of the two load centres and a share of the rated capacity, so none
  // of the three may be zero; a negative one flips the sign of the capacity.
  if (!(ratedCapacity > 0)) {
    throw new InputRangeError('ratedCapacity must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'ratedCapacity', exclusive_min: 0, got: ratedCapacity,
    });
  }
  if (!(ratedLoadCenter > 0)) {
    throw new InputRangeError('ratedLoadCenter must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'ratedLoadCenter', exclusive_min: 0, got: ratedLoadCenter,
    });
  }
  if (!(actualLoadCenter > 0)) {
    throw new InputRangeError('actualLoadCenter must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'actualLoadCenter', exclusive_min: 0, got: actualLoadCenter,
    });
  }
  if (!(attachmentWeightLoss >= 0)) {
    throw new InputRangeError('attachmentWeightLoss must not be negative', {
      code: 'parameter_out_of_range', parameter: 'attachmentWeightLoss', min: 0, got: attachmentWeightLoss,
    });
  }
  if (actualLoad !== undefined && !(actualLoad >= 0)) {
    throw new InputRangeError('actualLoad must not be negative', {
      code: 'parameter_out_of_range', parameter: 'actualLoad', min: 0, got: actualLoad,
    });
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
