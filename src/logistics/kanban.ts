import { roundTo, requireFinite } from '../utils.js';
import type { KanbanInput, KanbanResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate the number of kanban cards required
 *
 * Kanban is a scheduling system for lean manufacturing and just-in-time production.
 * The number of kanbans determines the maximum inventory in the system.
 *
 * Formula: K = (D × L × (1 + S)) / C
 * Where:
 *   D = Daily demand
 *   L = Lead time (days)
 *   S = Safety factor (decimal)
 *   C = Container quantity (units per container)
 *
 * @param input - Kanban calculation parameters
 * @returns Number of kanban cards and related metrics
 * @throws {RangeError} dailyDemand, leadTime or containerQuantity is not greater than 0, or
 *   safetyFactor is negative
 */
export function kanban(input: KanbanInput): KanbanResult {
  requireFinite('kanban', input);
  const { dailyDemand, leadTime, safetyFactor, containerQuantity } = input;

  if (!(dailyDemand > 0)) {
    throw inputRangeError('dailyDemand must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'dailyDemand', exclusive_min: 0, got: dailyDemand,
    });
  }
  if (!(leadTime > 0)) {
    throw inputRangeError('leadTime must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'leadTime', exclusive_min: 0, got: leadTime,
    });
  }
  if (!(containerQuantity > 0)) {
    throw inputRangeError('containerQuantity must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'containerQuantity', exclusive_min: 0, got: containerQuantity,
    });
  }
  // A negative safety factor removes stock below the lead-time demand; it was answered with zero cards.
  if (!(safetyFactor >= 0)) {
    throw inputRangeError('safetyFactor must not be negative', {
      code: 'parameter_out_of_range', parameter: 'safetyFactor', min: 0, got: safetyFactor,
    });
  }

  // Calculate demand during lead time
  const demandDuringLeadTime = roundTo(dailyDemand * leadTime, 2);

  // Calculate safety stock
  const safety = roundTo(demandDuringLeadTime * safetyFactor, 2);

  // Calculate total requirement
  const totalRequirement = roundTo(demandDuringLeadTime * (1 + safetyFactor), 2);

  // Calculate number of kanbans
  const numberOfKanbans = roundTo(totalRequirement / containerQuantity, 2);

  // Round up to nearest integer (you can't have a partial kanban card)
  const numberOfKanbansRounded = Math.ceil(numberOfKanbans);

  return {
    numberOfKanbans,
    numberOfKanbansRounded,
    demandDuringLeadTime,
    safetyStock: safety,
    totalRequirement,
  };
}
