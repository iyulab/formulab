import type { TaktTimeInput, TaktTimeResult, TimeUnit } from './types.js';
import { requireFinite } from '../utils.js';

/**
 * Convert time to hours based on unit
 */
function toHours(time: number, unit: TimeUnit): number {
  switch (unit) {
    case 'seconds':
      return time / 3600;
    case 'minutes':
      return time / 60;
    case 'hours':
      return time;
  }
}

/**
 * Calculate Takt Time
 *
 * Takt Time = Available Time / Customer Demand
 *
 * Takt time is the rate at which products must be produced to meet customer demand.
 *
 * @param input - Takt time input parameters
 * @returns Takt time result with time per unit and max rate per hour
 * @throws {RangeError} availableTime or demand not a positive finite number — with no demand (or no
 *   time) there is no pace to set, and 0 would read as "no time per unit".
 */
export function taktTime(input: TaktTimeInput): TaktTimeResult {
  requireFinite('taktTime', input);
  const { availableTime, demand, timeUnit } = input;

  if (!Number.isFinite(availableTime) || availableTime <= 0) {
    throw new RangeError('availableTime must be a positive finite number');
  }
  if (!Number.isFinite(demand) || demand <= 0) {
    throw new RangeError('demand must be a positive finite number');
  }

  // Takt Time = Available Time / Demand (in the same unit as input)
  const takt = availableTime / demand;

  // Convert available time to hours for rate calculation
  const availableTimeHours = toHours(availableTime, timeUnit);

  // Max rate per hour = Demand / Available Time (in hours)
  const maxRatePerHour = demand / availableTimeHours;

  return {
    taktTime: takt,
    maxRatePerHour,
  };
}
