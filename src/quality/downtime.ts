import { roundTo } from '../utils.js';
import type { DowntimeInput, DowntimeResult } from './types.js';

/**
 * Calculate downtime cost analysis
 *
 * @param input - Downtime input parameters
 * @returns Downtime cost breakdown
 */
export function downtime(input: DowntimeInput): DowntimeResult {
  const { hourlyRate, laborCostPerHour, downtimeMinutes, plannedProductionUnits, unitPrice } = input;

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
