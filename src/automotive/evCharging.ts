import { roundTo } from '../utils.js';
import type { ChargingInput, ChargingResult } from './types.js';

/**
 * Calculate EV charging time and energy requirements
 *
 * Formula:
 * - Energy Needed (kWh) = Battery Capacity x (SOC End - SOC Start) / 100
 * - Energy From Grid (kWh) = Energy Needed / Efficiency
 * - Charging Time (h) = Energy From Grid / Charger Power
 *
 * @param input - Charging parameters
 * @returns Charging result with energy and time
 * @throws RangeError if socEndPercent is not greater than socStartPercent,
 *   or if chargerPowerKw is not greater than 0
 */
export function evCharging(input: ChargingInput): ChargingResult {
  const { batteryCapacityKwh, chargerPowerKw, socStartPercent, socEndPercent, efficiency } = input;

  if (socEndPercent <= socStartPercent) {
    throw new RangeError('socEndPercent must be greater than socStartPercent');
  }
  if (chargerPowerKw <= 0) {
    throw new RangeError('chargerPowerKw must be greater than 0');
  }

  const socDiff = (socEndPercent - socStartPercent) / 100;
  const energyNeeded = batteryCapacityKwh * socDiff;
  const energyFromGrid = energyNeeded / efficiency;
  const chargingTimeHours = energyFromGrid / chargerPowerKw;
  const chargingTimeMinutes = chargingTimeHours * 60;

  return {
    energyNeeded: roundTo(energyNeeded, 2),
    energyFromGrid: roundTo(energyFromGrid, 2),
    chargingTimeHours: roundTo(chargingTimeHours, 2),
    chargingTimeMinutes: roundTo(chargingTimeMinutes, 2),
  };
}
