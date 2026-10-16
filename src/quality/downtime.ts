import { roundTo, requireFinite } from '../utils.js';
import type { DowntimeInput, DowntimeResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate downtime cost analysis
 *
 * @param input - Downtime input parameters
 * @returns Downtime cost breakdown
 * @throws {RangeError} hourlyRate, laborCostPerHour, downtimeMinutes, plannedProductionUnits or unitPrice < 0
 */
export function downtime(input: DowntimeInput): DowntimeResult {
  requireFinite('downtime', input);
  const { hourlyRate, laborCostPerHour, downtimeMinutes, plannedProductionUnits, unitPrice } = input;

  const fields = { hourlyRate, laborCostPerHour, downtimeMinutes, plannedProductionUnits, unitPrice };
  for (const [name, value] of Object.entries(fields)) {
    if (!(value >= 0)) {
      throw inputRangeError(`${name} must not be negative`, {
        code: 'parameter_out_of_range', parameter: name, min: 0, got: value,
      });
    }
  }

  const downtimeHours = downtimeMinutes / 60;
  const lostUnits = plannedProductionUnits * downtimeHours;
  const laborCost = laborCostPerHour * downtimeHours;
  const equipmentCost = hourlyRate * downtimeHours;
  const lostRevenue = lostUnits * unitPrice;
  const totalCost = laborCost + equipmentCost + lostRevenue;

  return {
    downtimeHours: roundTo(downtimeHours, 2),
    lostUnits: roundTo(lostUnits, 0),
    laborCost: roundTo(laborCost, 2),
    equipmentCost: roundTo(equipmentCost, 2),
    lostRevenue: roundTo(lostRevenue, 2),
    totalCost: roundTo(totalCost, 2),
  };
}
