import { roundTo } from '../utils.js';
import type { BatteryPackConfigInput, BatteryPackConfigResult } from './types.js';

/**
 * Calculate battery pack series/parallel cell configuration
 *
 * @formula S = ceil(Vtarget / Vcell), P = ceil(Ahtarget / Ahcell)
 * @param input - Cell specs and target pack specs
 * @returns Series/parallel count, actual voltage/capacity, total energy
 */
export function batteryPackConfig(input: BatteryPackConfigInput): BatteryPackConfigResult {
  const { cellVoltage, cellCapacityAh, targetVoltage, targetCapacityAh } = input;

  const seriesCells = Math.ceil(targetVoltage / cellVoltage);
  const parallelCells = Math.ceil(targetCapacityAh / cellCapacityAh);
  const totalCells = seriesCells * parallelCells;

  const actualVoltage = roundTo(seriesCells * cellVoltage, 2);
  const actualCapacityAh = roundTo(parallelCells * cellCapacityAh, 2);
  const totalEnergyWh = roundTo(actualVoltage * actualCapacityAh, 2);
  const totalEnergyKWh = roundTo(totalEnergyWh / 1000, 3);

  return {
    seriesCells,
    parallelCells,
    totalCells,
    actualVoltage,
    actualCapacityAh,
    totalEnergyWh,
    totalEnergyKWh,
  };
}
