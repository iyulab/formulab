import { roundTo, requireFinite } from '../utils.js';
import type { BmsBalancingInput, BmsBalancingResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate BMS cell balancing time
 *
 * @formula time = (ΔV/Vavg × Ah × 1000) / ImA (minutes)
 * @reference BMS design guidelines, passive balancing
 * @param input - Cell voltages array, balancing current, cell capacity
 * @returns Balancing time estimates and cell-level details
 * @throws {RangeError} cellVoltages is missing or lists fewer than 2 cells, any cell voltage is not greater than 0, or
 *   balancingCurrentMA or cellCapacityAh is not greater than 0
 */
export function bmsBalancing(input: BmsBalancingInput): BmsBalancingResult {
  requireFinite('bmsBalancing', input);
  const { cellVoltages, balancingCurrentMA, cellCapacityAh } = input;

  // Balancing moves charge between cells: one cell has nothing to balance against, and a missing
  // list used to fail as a TypeError inside the function.
  if (!Array.isArray(cellVoltages) || cellVoltages.length < 2) {
    throw inputRangeError('cellVoltages must list at least 2 cells', {
      code: 'insufficient_data', parameter: 'cellVoltages', min: 2, got: Array.isArray(cellVoltages) ? cellVoltages.length : 0,
    });
  }
  // The balancing time divides by the pack average, so a cell at or below zero volts
  // would drive it to infinity rather than describing a pack that can be balanced.
  const notPositive = cellVoltages.findIndex((v) => !(v > 0));
  if (notPositive >= 0) {
    throw inputRangeError('every cell voltage must be greater than 0', {
      code: 'parameter_out_of_range', parameter: `cellVoltages[${notPositive}]`, exclusive_min: 0, got: cellVoltages[notPositive],
    });
  }
  if (!(balancingCurrentMA > 0)) {
    throw inputRangeError('balancingCurrentMA must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'balancingCurrentMA', exclusive_min: 0, got: balancingCurrentMA,
    });
  }
  if (!(cellCapacityAh > 0)) {
    throw inputRangeError('cellCapacityAh must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'cellCapacityAh', exclusive_min: 0, got: cellCapacityAh,
    });
  }

  const maxVoltage = Math.max(...cellVoltages);
  const minVoltage = Math.min(...cellVoltages);
  const voltageDelta = roundTo(maxVoltage - minVoltage, 4);
  const averageVoltage = roundTo(
    cellVoltages.reduce((sum, v) => sum + v, 0) / cellVoltages.length,
    4,
  );

  // Balance threshold: 10mV
  const isBalanced = voltageDelta <= 0.01;

  const cellDetails = cellVoltages.map((voltage, index) => {
    const deltaFromAvg = roundTo((voltage - averageVoltage) * 1000, 2); // mV
    // Only cells above average need balancing (discharge excess energy)
    let balancingTimeMin = 0;
    if (deltaFromAvg > 0) {
      // Energy to remove: ΔV/Vavg × Ah (in mAh), time = mAh / mA × 60
      const excessMah = (deltaFromAvg / 1000) / averageVoltage * cellCapacityAh * 1000;
      balancingTimeMin = roundTo(excessMah / balancingCurrentMA * 60, 1);
    }
    return {
      cellIndex: index,
      voltage: roundTo(voltage, 4),
      deltaFromAvg,
      balancingTimeMin,
    };
  });

  const maxBalancingTimeMin = roundTo(
    Math.max(...cellDetails.map(c => c.balancingTimeMin)),
    1,
  );
  const maxBalancingTimeH = roundTo(maxBalancingTimeMin / 60, 2);

  return {
    maxVoltage: roundTo(maxVoltage, 4),
    minVoltage: roundTo(minVoltage, 4),
    voltageDelta,
    averageVoltage,
    maxBalancingTimeMin,
    maxBalancingTimeH,
    isBalanced,
    cellDetails,
  };
}
