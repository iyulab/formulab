import type { SmtTaktInput, SmtTaktResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Calculate SMT line takt time and throughput
 *
 * One cycle is one **panel**: every component of its `boardsPerPanel` boards is placed, then the
 * setup/transfer time (per panel) is added. Throughput is reported in boards. Until 0.50.0 the
 * placement time covered one board while the shift total multiplied the cycles by the panel size,
 * so boards per hour and boards per shift disagreed whenever `boardsPerPanel` was above 1.
 *
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

  // Placement time per panel (seconds): every board on the panel is populated in one cycle.
  // placementRate is in components per hour (cph).
  const placementTimeSec = roundTo(((componentsPerBoard * boardsPerPanel) / placementRate) * 3600, 2);

  // Total cycle time includes setup time
  const totalCycleTimeSec = roundTo(placementTimeSec + setupTimeSec, 2);

  // Boards per hour: panels per hour × boards per panel (cycle time is positive: placement time
  // is, and setup is not negative)
  const boardsPerHour = roundTo((3600 / totalCycleTimeSec) * boardsPerPanel, 2);

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
