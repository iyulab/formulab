import { roundTo } from '../utils.js';
import type { BoilerEfficiencyInput, BoilerEfficiencyResult } from './types.js';

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
    throw new RangeError('fuelRate must be greater than 0');
  }
  if (!(fuelHeatValue > 0)) {
    throw new RangeError('fuelHeatValue must be greater than 0');
  }
  if (!(steamOutput >= 0)) {
    throw new RangeError('steamOutput must not be negative');
  }
  if (!(steamEnthalpy >= 0)) {
    throw new RangeError('steamEnthalpy must not be negative');
  }
  if (!(feedwaterEnthalpy >= 0)) {
    throw new RangeError('feedwaterEnthalpy must not be negative');
  }
  if (operatingHours !== undefined && !(operatingHours >= 0)) {
    throw new RangeError('operatingHours must not be negative');
  }
  if (fuelCost !== undefined && !(fuelCost >= 0)) {
    throw new RangeError('fuelCost must not be negative');
  }

  // kJ/h → kW (÷ 3600)
  const heatInput = (fuelRate * fuelHeatValue) / 3600;
  const heatOutput = (steamOutput * (steamEnthalpy - feedwaterEnthalpy)) / 3600;
  if (steamEnthalpy < feedwaterEnthalpy) {
    throw new RangeError('steamEnthalpy must not be lower than feedwaterEnthalpy');
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
