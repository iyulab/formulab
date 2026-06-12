import type { CompressedAirCostInput, CompressedAirCostResult } from './types.js';

// Conversion factor: 1 m³ = 35.3147 ft³ (cubic feet)
const M3_TO_FT3 = 35.3147;

/**
 * Calculate compressed air production cost
 *
 * Electricity cost = compressor power (kW) * running hours * electricity rate ($/kWh)
 * Total cost = electricity cost + maintenance cost
 * Cost per m³ = total cost / air output (m³)
 * Cost per ft³ = cost per m³ / 35.3147 (m³ to ft³ conversion)
 *
 * @param input - Compressed air cost input parameters
 * @returns Compressed air cost result
 * @throws RangeError if compressorPower, runningHours, or airOutput is not positive
 */
export function compressedAirCost(input: CompressedAirCostInput): CompressedAirCostResult {
  const { compressorPower, runningHours, electricityRate, airOutput, maintenanceCost } = input;

  if (compressorPower <= 0) {
    throw new RangeError('compressorPower must be greater than 0');
  }
  if (runningHours <= 0) {
    throw new RangeError('runningHours must be greater than 0');
  }
  if (airOutput <= 0) {
    throw new RangeError('airOutput must be greater than 0');
  }

  // Calculate electricity cost
  const electricityCost = compressorPower * runningHours * electricityRate;

  // Calculate total cost
  const totalCost = electricityCost + maintenanceCost;

  // Calculate cost per unit volume
  const costPerM3 = totalCost / airOutput;
  const costPerFt3 = costPerM3 / M3_TO_FT3;

  return {
    electricityCost,
    totalCost,
    costPerM3,
    costPerFt3,
  };
}
