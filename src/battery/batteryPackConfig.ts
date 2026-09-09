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

  if (!(cellVoltage > 0)) {
    throw new RangeError('cellVoltage must be greater than 0');
  }
  if (!(cellCapacityAh > 0)) {
    throw new RangeError('cellCapacityAh must be greater than 0');
  }
  if (!(targetVoltage > 0)) {
    throw new RangeError('targetVoltage must be greater than 0');
  }
  if (!(targetCapacityAh > 0)) {
    throw new RangeError('targetCapacityAh must be greater than 0');
  }

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
