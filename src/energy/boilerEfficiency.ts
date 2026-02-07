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

  if (fuelRate <= 0 || fuelHeatValue <= 0) {
    return {
      heatInput: 0,
      heatOutput: 0,
      heatLoss: 0,
      efficiency: 0,
      annualFuelCost: null,
      annualHeatLoss: null,
    };
  }

  // kJ/h → kW (÷ 3600)
  const heatInput = (fuelRate * fuelHeatValue) / 3600;
  const heatOutput = (steamOutput * (steamEnthalpy - feedwaterEnthalpy)) / 3600;
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
