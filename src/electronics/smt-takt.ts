import type { SmtTaktInput, SmtTaktResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Calculate SMT line takt time and throughput
 * @param input - SMT line parameters
 * @returns Takt time calculation results; `setupTimeSec` is echoed so the cycle time can be shown as placement + setup
 * @throws {RangeError} placementRate, componentsPerBoard or boardsPerPanel ≤ 0; setupTimeSec or availableTimeMin < 0
 */
export function smtTakt(input: SmtTaktInput): SmtTaktResult {
  const {
    placementRate,
    componentsPerBoard,
    boardsPerPanel,
    setupTimeSec,
    availableTimeMin,
  } = input;

  // Guard against invalid inputs
  if (placementRate <= 0) {
    throw new RangeError('placementRate must be greater than 0');
  }
  if (componentsPerBoard <= 0) {
    throw new RangeError('componentsPerBoard must be greater than 0');
  }
  if (setupTimeSec < 0) {
    throw new RangeError('setupTimeSec must not be negative');
  }
  if (availableTimeMin < 0) {
    throw new RangeError('availableTimeMin must not be negative');
  }
  if (boardsPerPanel <= 0) {
    throw new RangeError('boardsPerPanel must be greater than 0');
  }

  // Calculate placement time per board (seconds)
  // placementRate is in components per hour (cph)
  // placementTime = (components / rate) * 3600
  const placementTimeSec = roundTo((componentsPerBoard / placementRate) * 3600, 2);

  // Total cycle time includes setup time
  const totalCycleTimeSec = roundTo(placementTimeSec + setupTimeSec, 2);

  // Boards per hour (cycle time is positive: placement time is, and setup is not negative)
  const boardsPerHour = roundTo(3600 / totalCycleTimeSec, 2);

  // Total boards per shift (available time in minutes * 60 / cycle time) * boards per panel
  const availableTimeSec = availableTimeMin * 60;
  const totalBoardsPerShift = Math.floor((availableTimeSec / totalCycleTimeSec) * boardsPerPanel);

  // Line utilization: ratio of pure placement time to total cycle time
  const lineUtilization = roundTo((placementTimeSec / totalCycleTimeSec) * 100, 2);

  return {
    placementTimeSec,
    setupTimeSec,
    totalCycleTimeSec,
    boardsPerHour,
    totalBoardsPerShift,
    lineUtilization,
  };
}
