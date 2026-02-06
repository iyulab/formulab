import { roundTo } from '../utils.js';
import type { FuelType, Scope1EmissionsInput, Scope1EmissionsResult } from './types.js';

/**
 * Combustion emission factors (kgCO2 per unit)
 * @reference EPA GHG Emission Factors Hub, IPCC 2006
 */
const COMBUSTION_FACTORS: Record<FuelType, { factor: number; unit: string }> = {
  naturalGas: { factor: 1.885, unit: 'm³' },    // kgCO2/m³
  diesel:     { factor: 2.68,  unit: 'L' },      // kgCO2/L
  gasoline:   { factor: 2.31,  unit: 'L' },      // kgCO2/L
  lpg:        { factor: 1.51,  unit: 'L' },      // kgCO2/L
  coal:       { factor: 2.42,  unit: 'kg' },     // kgCO2/kg
  fuelOil:    { factor: 3.15,  unit: 'L' },      // kgCO2/L
};

/**
 * Calculate Scope 1 (direct) CO2 emissions from fuel combustion
 *
 * @formula CO2 = quantity × emissionFactor
 * @reference GHG Protocol, EPA Emission Factors Hub, IPCC 2006
 * @param input - Fuel type and quantity consumed
 * @returns CO2 emissions in kg and tonnes
 */
export function scope1Emissions(input: Scope1EmissionsInput): Scope1EmissionsResult {
  const { fuelType, quantity } = input;
  const { factor, unit } = COMBUSTION_FACTORS[fuelType];

  const co2Kg = roundTo(quantity * factor, 2);
  const co2Tonnes = roundTo(co2Kg / 1000, 4);

  return {
    co2Kg,
    co2Tonnes,
    fuelType,
    emissionFactor: factor,
    unit,
  };
}
