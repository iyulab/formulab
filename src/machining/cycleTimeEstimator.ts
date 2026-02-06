import { roundTo } from '../utils.js';
import type { CycleTimeEstimatorInput, CycleTimeEstimatorResult } from './types.js';

const DEFAULT_RAPID_RATE = 10000; // mm/min

/**
 * Estimate CNC cycle time from a list of operations.
 *
 * @formula
 *   cutting time = Σ(distance / feedRate) for cutting operations
 *   rapid time = Σ(distance / rapidRate) for rapid operations
 *   tool change time = Σ(time) for toolChange operations
 *   dwell time = Σ(time) for dwell operations
 *   cycleTime = cuttingTime + rapidTime + toolChangeTime + dwellTime
 *   totalTime = setupTime + cycleTime × partCount
 *   utilization = cuttingTime / cycleTime × 100
 *
 * @param input - Cycle time parameters
 * @returns CycleTimeEstimatorResult with time breakdown and utilization
 */
export function cycleTimeEstimator(input: CycleTimeEstimatorInput): CycleTimeEstimatorResult {
  const { operations, setupTime = 0, partCount = 1 } = input;

  let cuttingTime = 0;   // seconds
  let rapidTime = 0;     // seconds
  let toolChangeTime = 0; // seconds
  let dwellTime = 0;     // seconds

  for (const op of operations) {
    switch (op.type) {
      case 'cutting': {
        if (op.distance !== undefined && op.feedRate !== undefined && op.feedRate > 0) {
          cuttingTime += (op.distance / op.feedRate) * 60; // mm/(mm/min) → min → sec
        }
        break;
      }
      case 'rapid': {
        if (op.distance !== undefined) {
          const rate = op.rapidRate ?? DEFAULT_RAPID_RATE;
          rapidTime += (op.distance / rate) * 60;
        }
        break;
      }
      case 'toolChange': {
        toolChangeTime += op.time ?? 0;
        break;
      }
      case 'dwell': {
        dwellTime += op.time ?? 0;
        break;
      }
    }
  }

  const cycleTime = cuttingTime + rapidTime + toolChangeTime + dwellTime;
  const totalTime = setupTime + cycleTime * partCount;
  const utilization = cycleTime > 0 ? (cuttingTime / cycleTime) * 100 : 0;

  return {
    cuttingTime: roundTo(cuttingTime, 2),
    rapidTime: roundTo(rapidTime, 2),
    toolChangeTime: roundTo(toolChangeTime, 2),
    dwellTime: roundTo(dwellTime, 2),
    cycleTime: roundTo(cycleTime, 2),
    totalTime: roundTo(totalTime, 2),
    utilization: roundTo(utilization, 2),
  };
}
