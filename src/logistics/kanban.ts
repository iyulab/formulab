import { roundTo } from '../utils.js';
import type { KanbanInput, KanbanResult } from './types.js';

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
 */
export function kanban(input: KanbanInput): KanbanResult {
  const { dailyDemand, leadTime, safetyFactor, containerQuantity } = input;

  if (dailyDemand <= 0) throw new RangeError('dailyDemand must be greater than 0');
  if (leadTime <= 0) throw new RangeError('leadTime must be greater than 0');
  if (containerQuantity <= 0) throw new RangeError('containerQuantity must be greater than 0');

  // Negative safety factor is invalid but returns a zero result (not a throw)
  if (safetyFactor < 0) {
    return {
      numberOfKanbans: 0,
      numberOfKanbansRounded: 0,
      demandDuringLeadTime: 0,
      safetyStock: 0,
      totalRequirement: 0,
    };
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
