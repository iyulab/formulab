import { roundTo, requireFinite } from '../utils.js';
import type { CycleTimeEstimatorInput, CycleTimeEstimatorResult } from './types.js';
import { InputRangeError } from '../errors.js';

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
 * @returns CycleTimeEstimatorResult — `utilization` is `null` when the operations add up to no time
 * @throws RangeError if operations is empty, an operation distance or time is negative, setupTime or partCount is
 *   negative, a cutting move with a distance or feed rate has a feed rate that is missing or not
 *   greater than 0, or a rapid move has a rapid rate that is not greater than 0
 */
export function cycleTimeEstimator(input: CycleTimeEstimatorInput): CycleTimeEstimatorResult {
  requireFinite('cycleTimeEstimator', input);
  const { operations, setupTime = 0, partCount = 1 } = input;

  // A cycle with no moves has no time to estimate — a 0 s cycle would read as an answer.
  if (operations.length === 0) {
    throw new InputRangeError('operations must not be empty', { code: 'empty_input', parameter: 'operations' });
  }
  if (!(setupTime >= 0)) {
    throw new InputRangeError('setupTime must not be negative', {
      code: 'parameter_out_of_range', parameter: 'setupTime', min: 0, got: setupTime,
    });
  }
  if (!(partCount >= 0)) {
    throw new InputRangeError('partCount must not be negative', {
      code: 'parameter_out_of_range', parameter: 'partCount', min: 0, got: partCount,
    });
  }
  operations.forEach((op, i) => {
    if (op.distance !== undefined && !(op.distance >= 0)) {
      throw new InputRangeError(`operations[${i}].distance must not be negative`, {
        code: 'parameter_out_of_range', parameter: 'op.distance', min: 0, got: op.distance,
      });
    }
    if (op.time !== undefined && !(op.time >= 0)) {
      throw new InputRangeError(`operations[${i}].time must not be negative`, {
        code: 'parameter_out_of_range', parameter: 'op.time', min: 0, got: op.time,
      });
    }
    // A cutting move with a distance but no positive feed has no duration to add; skipping it
    // silently would under-report the cycle.
    if (op.type === 'cutting' && (op.feedRate !== undefined || op.distance !== undefined)
      && !(op.feedRate !== undefined && op.feedRate > 0)) {
      throw new RangeError(`operations[${i}].feedRate must be greater than 0`);
    }
  });

  let cuttingTime = 0;   // seconds
  let rapidTime = 0;     // seconds
  let toolChangeTime = 0; // seconds
  let dwellTime = 0;     // seconds

  for (const op of operations) {
    switch (op.type) {
      case 'cutting': {
        if (op.distance !== undefined && op.feedRate !== undefined) {
          cuttingTime += (op.distance / op.feedRate) * 60; // mm/(mm/min) → min → sec
        }
        break;
      }
      case 'rapid': {
        if (op.distance !== undefined) {
          const rate = op.rapidRate ?? DEFAULT_RAPID_RATE;
          if (!(rate > 0)) {
            throw new RangeError('rapidRate must be greater than 0');
          }
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
  // Cutting share of a cycle that takes no time has no value.
  const utilization = cycleTime > 0 ? (cuttingTime / cycleTime) * 100 : null;

  return {
    cuttingTime: roundTo(cuttingTime, 2),
    rapidTime: roundTo(rapidTime, 2),
    toolChangeTime: roundTo(toolChangeTime, 2),
    dwellTime: roundTo(dwellTime, 2),
    cycleTime: roundTo(cycleTime, 2),
    totalTime: roundTo(totalTime, 2),
    utilization: utilization === null ? null : roundTo(utilization, 2),
  };
}
