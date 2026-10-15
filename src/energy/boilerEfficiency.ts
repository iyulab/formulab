import { roundTo, requireFinite } from '../utils.js';
import type { BoilerEfficiencyInput, BoilerEfficiencyResult } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate boiler thermal efficiency using the direct (input-output) method.
 *
 * η = (steamOutput × (steamEnthalpy − feedwaterEnthalpy)) / (fuelRate × fuelHeatValue) × 100
 *
 * Heat values are converted from kJ to kW by dividing by 3600 (kJ/h → kW).
 *
 * @param input - Boiler operating parameters
 * @returns Boiler efficiency result with heat balance and optional annual metrics
 * @throws {RangeError} fuelRate or fuelHeatValue is not greater than 0 (the heat input divides
 *   the efficiency), or steamOutput, steamEnthalpy, feedwaterEnthalpy, operatingHours or fuelCost
 *   is negative
 */
export function boilerEfficiency(input: BoilerEfficiencyInput): BoilerEfficiencyResult {
  requireFinite('boilerEfficiency', input);
  const {
    fuelRate,
    fuelHeatValue,
    steamOutput,
    steamEnthalpy,
    feedwaterEnthalpy,
    operatingHours,
    fuelCost,
  } = input;

  // The efficiency is a share of the fuel heat input, so a fuel side at or below zero has no
  // efficiency to report; a negative flow, enthalpy, duration or price flips the sign of a result.
  if (!(fuelRate > 0)) {
    throw new InputRangeError('fuelRate must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'fuelRate', exclusive_min: 0, got: fuelRate,
    });
  }
  if (!(fuelHeatValue > 0)) {
    throw new InputRangeError('fuelHeatValue must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'fuelHeatValue', exclusive_min: 0, got: fuelHeatValue,
    });
  }
  if (!(steamOutput >= 0)) {
    throw new InputRangeError('steamOutput must not be negative', {
      code: 'parameter_out_of_range', parameter: 'steamOutput', min: 0, got: steamOutput,
    });
  }
  if (!(steamEnthalpy >= 0)) {
    throw new InputRangeError('steamEnthalpy must not be negative', {
      code: 'parameter_out_of_range', parameter: 'steamEnthalpy', min: 0, got: steamEnthalpy,
    });
  }
  if (!(feedwaterEnthalpy >= 0)) {
    throw new InputRangeError('feedwaterEnthalpy must not be negative', {
      code: 'parameter_out_of_range', parameter: 'feedwaterEnthalpy', min: 0, got: feedwaterEnthalpy,
    });
  }
  if (operatingHours !== undefined && !(operatingHours >= 0)) {
    throw new InputRangeError('operatingHours must not be negative', {
      code: 'parameter_out_of_range', parameter: 'operatingHours', min: 0, got: operatingHours,
    });
  }
  if (fuelCost !== undefined && !(fuelCost >= 0)) {
    throw new InputRangeError('fuelCost must not be negative', {
      code: 'parameter_out_of_range', parameter: 'fuelCost', min: 0, got: fuelCost,
    });
  }

  // kJ/h → kW (÷ 3600)
  const heatInput = (fuelRate * fuelHeatValue) / 3600;
  const heatOutput = (steamOutput * (steamEnthalpy - feedwaterEnthalpy)) / 3600;
  if (steamEnthalpy < feedwaterEnthalpy) {
    throw new InputRangeError('steamEnthalpy must not be lower than feedwaterEnthalpy', {
      code: 'parameter_out_of_range', parameter: 'steamEnthalpy', min: feedwaterEnthalpy, got: steamEnthalpy,
    });
  }
  // The steam cannot carry more heat than the fuel supplied — that would be an efficiency above 100 %.
  if (heatOutput > heatInput) {
    throw new RangeError('the steam output carries more heat than the fuel supplies (efficiency above 100 %)');
  }
  const heatLoss = heatInput - heatOutput;
  const efficiency = (heatOutput / heatInput) * 100;

  let annualFuelCost: number | null = null;
  if (operatingHours !== undefined && fuelCost !== undefined) {
    annualFuelCost = fuelRate * operatingHours * fuelCost;
  }

  let annualHeatLoss: number | null = null;
  if (operatingHours !== undefined) {
    annualHeatLoss = heatLoss * operatingHours;
  }

  return {
    heatInput: roundTo(heatInput, 4),
    heatOutput: roundTo(heatOutput, 4),
    heatLoss: roundTo(heatLoss, 4),
    efficiency: roundTo(efficiency, 4),
    annualFuelCost: annualFuelCost !== null ? roundTo(annualFuelCost, 2) : null,
    annualHeatLoss: annualHeatLoss !== null ? roundTo(annualHeatLoss, 4) : null,
  };
}
