import { roundTo } from '../utils.js';
import type { EmissionsIntensityInput, EmissionsIntensityResult } from './types.js';

/**
 * Calculate emissions intensity across multiple metrics
 *
 * @formula kg/unit, kg/USD, kg/employee
 * @reference GHG Protocol, CDP
 * @param input - Total CO2 and normalization denominators
 * @returns Emissions intensity per unit, revenue, and/or employee
 */
export function emissionsIntensity(input: EmissionsIntensityInput): EmissionsIntensityResult {
  const { totalCo2Kg, productionUnits, revenueUsd, employees } = input;

  const kgPerUnit = productionUnits != null && productionUnits > 0
    ? roundTo(totalCo2Kg / productionUnits, 4)
    : undefined;

  const kgPerRevenue = revenueUsd != null && revenueUsd > 0
    ? roundTo(totalCo2Kg / revenueUsd, 6)
    : undefined;

  const kgPerEmployee = employees != null && employees > 0
    ? roundTo(totalCo2Kg / employees, 2)
    : undefined;

  const tonnesPerMillionUsd = revenueUsd != null && revenueUsd > 0
    ? roundTo((totalCo2Kg / 1000) / (revenueUsd / 1000000), 2)
    : undefined;

  return { kgPerUnit, kgPerRevenue, kgPerEmployee, tonnesPerMillionUsd };
}
