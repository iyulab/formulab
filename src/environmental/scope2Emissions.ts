import { roundTo } from '../utils.js';
import type { GridRegion, Scope2EmissionsInput, Scope2EmissionsResult } from './types.js';

/**
 * Grid emission factors (gCO2/kWh)
 * @reference IEA 2023 Emission Factors
 */
const GRID_EMISSION_FACTORS: Record<Exclude<GridRegion, 'custom'>, number> = {
  US_average: 386,
  EU_average: 230,
  China: 555,
  India: 708,
  Japan: 457,
  Korea: 415,
  UK: 207,
  Germany: 350,
  France: 56,
  Brazil: 75,
  Australia: 656,
  Canada: 110,
};

/**
 * Calculate Scope 2 (indirect) CO2 emissions from purchased electricity
 *
 * @formula CO2(kg) = kWh × gridFactor / 1000
 * @reference GHG Protocol Scope 2, IEA Emission Factors 2023
 * @throws {RangeError} customFactor is required when region is "custom"
 * @param input - Electricity consumption and grid region
 * @returns CO2 emissions in kg and tonnes
 */
export function scope2Emissions(input: Scope2EmissionsInput): Scope2EmissionsResult {
  const { electricityKwh, region, customFactor } = input;

  let gridFactor: number;
  if (region === 'custom') {
    if (customFactor == null) {
      throw new RangeError('customFactor is required when region is "custom"');
    }
    gridFactor = customFactor;
  } else {
    gridFactor = GRID_EMISSION_FACTORS[region];
  }

  const co2Kg = roundTo(electricityKwh * gridFactor / 1000, 2);
  const co2Tonnes = roundTo(co2Kg / 1000, 4);

  return {
    co2Kg,
    co2Tonnes,
    gridFactor,
    region,
  };
}
