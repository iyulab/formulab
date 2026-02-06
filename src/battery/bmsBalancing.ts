import { roundTo } from '../utils.js';
import type { BmsBalancingInput, BmsBalancingResult } from './types.js';

/**
 * Calculate BMS cell balancing time
 *
 * @formula time = (ΔV/Vavg × Ah × 1000) / ImA (minutes)
 * @reference BMS design guidelines, passive balancing
 * @param input - Cell voltages array, balancing current, cell capacity
 * @returns Balancing time estimates and cell-level details
 */
export function bmsBalancing(input: BmsBalancingInput): BmsBalancingResult {
  const { cellVoltages, balancingCurrentMA, cellCapacityAh } = input;

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
