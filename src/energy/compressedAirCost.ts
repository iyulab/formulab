import type { CompressedAirCostInput, CompressedAirCostResult } from './types.js';

// Conversion factor: 1 m3 = 35.3147 CFM (cubic feet per minute)
const M3_TO_CFM = 35.3147;

/**
 * Calculate compressed air production cost
 *
 * Electricity cost = compressor power (kW) * running hours * electricity rate ($/kWh)
 * Total cost = electricity cost + maintenance cost
 * Cost per m3 = total cost / air output (m3)
 * Cost per CFM = cost per m3 / 35.3147 (m3 to CFM conversion)
 *
 * @param input - Compressed air cost input parameters
 * @returns Compressed air cost result
 */
export function compressedAirCost(input: CompressedAirCostInput): CompressedAirCostResult {
  const { compressorPower, runningHours, electricityRate, airOutput, maintenanceCost } = input;

  // Handle edge case - invalid inputs
  if (compressorPower <= 0 || runningHours <= 0 || airOutput <= 0) {
    return {
      electricityCost: 0,
      totalCost: 0,
      costPerM3: 0,
      costPerCfm: 0,
    };
  }

  // Calculate electricity cost
  const electricityCost = compressorPower * runningHours * electricityRate;

  // Calculate total cost
  const totalCost = electricityCost + maintenanceCost;

  // Calculate cost per unit volume
  const costPerM3 = totalCost / airOutput;
  const costPerCfm = costPerM3 / M3_TO_CFM;

  return {
    electricityCost,
    totalCost,
    costPerM3,
    costPerCfm,
  };
}
