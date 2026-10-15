import { roundTo, requireFinite } from '../utils.js';
import type { BatteryPackConfigInput, BatteryPackConfigResult } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate battery pack series/parallel cell configuration
 *
 * @formula S = ceil(Vtarget / Vcell), P = ceil(Ahtarget / Ahcell)
 * @param input - Cell specs and target pack specs
 * @returns Series/parallel count, actual voltage/capacity, total energy
 */
export function batteryPackConfig(input: BatteryPackConfigInput): BatteryPackConfigResult {
  requireFinite('batteryPackConfig', input);
  const { cellVoltage, cellCapacityAh, targetVoltage, targetCapacityAh } = input;

  if (!(cellVoltage > 0)) {
    throw new InputRangeError('cellVoltage must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'cellVoltage', exclusive_min: 0, got: cellVoltage,
    });
  }
  if (!(cellCapacityAh > 0)) {
    throw new InputRangeError('cellCapacityAh must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'cellCapacityAh', exclusive_min: 0, got: cellCapacityAh,
    });
  }
  if (!(targetVoltage > 0)) {
    throw new InputRangeError('targetVoltage must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'targetVoltage', exclusive_min: 0, got: targetVoltage,
    });
  }
  if (!(targetCapacityAh > 0)) {
    throw new InputRangeError('targetCapacityAh must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'targetCapacityAh', exclusive_min: 0, got: targetCapacityAh,
    });
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
