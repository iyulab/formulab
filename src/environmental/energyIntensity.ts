import { roundTo } from '../utils.js';
import type { EnergyIntensityInput, EnergyIntensityResult } from './types.js';

/**
 * Calculate energy intensity (energy per unit of production or revenue)
 *
 * @formula MJ/unit = totalMJ / units, kWh/unit = MJ/unit / 3.6
 * @reference ISO 50001 Energy Management
 * @param input - Total energy, production units, optional revenue
 * @returns Energy intensity in MJ/unit, kWh/unit, and optionally MJ/USD
 * @throws {RangeError} totalEnergyMJ < 0, or productionUnits ≤ 0
 */
export function energyIntensity(input: EnergyIntensityInput): EnergyIntensityResult {
  const { totalEnergyMJ, productionUnits, revenueUsd } = input;

  if (totalEnergyMJ < 0) {
    throw new RangeError('totalEnergyMJ must not be negative');
  }
  if (productionUnits <= 0) {
    throw new RangeError('productionUnits must be greater than 0');
  }

  const mjPerUnit = roundTo(totalEnergyMJ / productionUnits, 4);
  const kwhPerUnit = roundTo(mjPerUnit / 3.6, 4);
  const mjPerRevenue = revenueUsd != null && revenueUsd > 0
    ? roundTo(totalEnergyMJ / revenueUsd, 4)
    : undefined;

  return { mjPerUnit, kwhPerUnit, mjPerRevenue };
}
