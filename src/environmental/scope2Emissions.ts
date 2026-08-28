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
 * Calculate Scope 2 (indirect) CO2 emissions from purchased electricity — location-based always,
 * market-based additionally when contractual/residual-mix inputs are supplied.
 *
 * @formula location-based: CO2(kg) = kWh × gridFactor / 1000
 * @formula market-based: CO2(kg) = (contractedKwh × supplierFactor + (kWh − contractedKwh) × residualMixFactor) / 1000
 * @reference GHG Protocol Scope 2, IEA Emission Factors 2023 (location-based grid factors);
 *   GHG Protocol Scope 2 Guidance (2015) Ch.4-6 (market-based dual reporting — this library does
 *   not embed residual-mix emission factors, since they are jurisdiction- and year-specific
 *   published figures; callers supply `residualMixFactor` from their own residual-mix disclosure
 *   source, e.g. AIB (Europe) or an equivalent national tracking-system publication)
 * @throws {RangeError} customFactor is required when region is "custom"
 * @throws {RangeError} contractedKwh cannot be negative
 * @throws {RangeError} supplierFactor is required when contractedKwh > 0
 * @throws {RangeError} contractedKwh cannot exceed electricityKwh
 * @throws {RangeError} residualMixFactor is required when contractedKwh < electricityKwh and
 *   market-based reporting was requested (any of contractedKwh/supplierFactor/residualMixFactor
 *   supplied)
 * @param input - Electricity consumption, grid region, and optional market-based inputs
 * @returns Location-based CO2 emissions always; market-based additionally when requested
 */
export function scope2Emissions(input: Scope2EmissionsInput): Scope2EmissionsResult {
  const { electricityKwh, region, customFactor, contractedKwh, supplierFactor, residualMixFactor } = input;

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

  const marketBasedRequested = contractedKwh != null || supplierFactor != null || residualMixFactor != null;
  let marketBasedCo2Kg: number | undefined;
  let marketBasedCo2Tonnes: number | undefined;

  if (marketBasedRequested) {
    const effectiveContractedKwh = contractedKwh ?? 0;
    if (effectiveContractedKwh < 0) {
      throw new RangeError('contractedKwh cannot be negative');
    }
    if (effectiveContractedKwh > 0 && supplierFactor == null) {
      throw new RangeError('supplierFactor is required when contractedKwh > 0');
    }
    if (effectiveContractedKwh > electricityKwh) {
      throw new RangeError('contractedKwh cannot exceed electricityKwh');
    }
    const remainderKwh = electricityKwh - effectiveContractedKwh;
    if (remainderKwh > 0 && residualMixFactor == null) {
      throw new RangeError('residualMixFactor is required when contractedKwh < electricityKwh');
    }

    const contractedCo2G = effectiveContractedKwh * (supplierFactor ?? 0);
    const residualCo2G = remainderKwh * (residualMixFactor ?? 0);
    marketBasedCo2Kg = roundTo((contractedCo2G + residualCo2G) / 1000, 2);
    marketBasedCo2Tonnes = roundTo(marketBasedCo2Kg / 1000, 4);
  }

  return {
    co2Kg,
    co2Tonnes,
    gridFactor,
    region,
    locationBasedCo2Kg: co2Kg,
    locationBasedCo2Tonnes: co2Tonnes,
    ...(marketBasedRequested ? { marketBasedCo2Kg, marketBasedCo2Tonnes } : {}),
  };
}
