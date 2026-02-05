import type { TaktTimeInput, TaktTimeResult, TimeUnit } from './types.js';

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
 */
export function taktTime(input: TaktTimeInput): TaktTimeResult {
  const { availableTime, demand, timeUnit } = input;

  // Handle edge cases
  if (demand <= 0 || availableTime <= 0) {
    return {
      taktTime: 0,
      maxRatePerHour: 0,
    };
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
