import type { CompressedAirCostInput, CompressedAirCostResult } from './types.js';
import { requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';

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
 * @throws RangeError if compressorPower, runningHours, or airOutput is not positive, or electricityRate or maintenanceCost is negative
 */
export function compressedAirCost(input: CompressedAirCostInput): CompressedAirCostResult {
  requireFinite('compressedAirCost', input);
  const { compressorPower, runningHours, electricityRate, airOutput, maintenanceCost } = input;

  if (compressorPower <= 0) {
    throw inputRangeError('compressorPower must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'compressorPower', exclusive_min: 0, got: compressorPower,
    });
  }
  if (runningHours <= 0) {
    throw inputRangeError('runningHours must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'runningHours', exclusive_min: 0, got: runningHours,
    });
  }
  if (airOutput <= 0) {
    throw inputRangeError('airOutput must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'airOutput', exclusive_min: 0, got: airOutput,
    });
  }
  if (electricityRate < 0) {
    throw inputRangeError('electricityRate must not be negative', {
      code: 'parameter_out_of_range', parameter: 'electricityRate', min: 0, got: electricityRate,
    });
  }
  if (maintenanceCost < 0) {
    throw inputRangeError('maintenanceCost must not be negative', {
      code: 'parameter_out_of_range', parameter: 'maintenanceCost', min: 0, got: maintenanceCost,
    });
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
    maintenanceCost,
    totalCost,
    costPerM3,
    costPerFt3,
  };
}
