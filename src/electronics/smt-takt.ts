import type { SmtTaktInput, SmtTaktResult } from './types.js';

/**
 * Round to specified decimal places
 */
function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate SMT line takt time and throughput
 * @param input - SMT line parameters
 * @returns Takt time calculation results
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
  if (componentsPerBoard <= 0) {
    return {
      placementTimeSec: 0,
      totalCycleTimeSec: 0,
      boardsPerHour: 0,
      totalBoardsPerShift: 0,
      lineUtilization: 0,
    };
  }

  if (placementRate <= 0) {
    return {
      placementTimeSec: 0,
      totalCycleTimeSec: 0,
      boardsPerHour: 0,
      totalBoardsPerShift: 0,
      lineUtilization: 0,
    };
  }

  // Calculate placement time per board (seconds)
  // placementRate is in components per hour (cph)
  // placementTime = (components / rate) * 3600
  const placementTimeSec = roundTo((componentsPerBoard / placementRate) * 3600, 2);

  // Total cycle time includes setup time
  const totalCycleTimeSec = roundTo(placementTimeSec + setupTimeSec, 2);

  // Boards per hour
  const boardsPerHour = totalCycleTimeSec > 0 ? roundTo(3600 / totalCycleTimeSec, 2) : 0;

  // Total boards per shift (available time in minutes * 60 / cycle time) * boards per panel
  const availableTimeSec = availableTimeMin * 60;
  const totalBoardsPerShift = totalCycleTimeSec > 0
    ? Math.floor((availableTimeSec / totalCycleTimeSec) * boardsPerPanel)
    : 0;

  // Line utilization: ratio of pure placement time to total cycle time
  const lineUtilization = totalCycleTimeSec > 0
    ? roundTo((placementTimeSec / totalCycleTimeSec) * 100, 2)
    : 0;

  return {
    placementTimeSec,
    totalCycleTimeSec,
    boardsPerHour,
    totalBoardsPerShift,
    lineUtilization,
  };
}
