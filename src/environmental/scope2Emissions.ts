import { roundTo } from '../utils.js';
import type { GridRegion, Scope2EmissionsInput, Scope2EmissionsResult } from './types.js';

/**
 * Grid emission factors (gCO2/kWh), most recent full calendar year.
 * @reference Our World in Data — "Carbon intensity of electricity generation"
 *   (ourworldindata.org/grapher/carbon-intensity-electricity), sourced from Ember's Yearly
 *   Electricity Data; 2025 figures, accessed 2026-09-02. Cross-checked against Umweltbundesamt
 *   (German Federal Environment Agency) national statistics for Germany (2025: ~328 gCO2/kWh,
 *   within 1% of the Ember-sourced 330 used here).
 * @remarks Replaces the previous "IEA 2023 Emission Factors" table (docket
 *   `iyulab/formulab` #173 / `iyulab/online-tools` ISSUE-formulab-20260902 — the prior figures
 *   could not be reproduced against any accessible source, IEA's own Emissions Factors data
 *   product requires a paid license). Update annually against the same Our World in Data series
 *   when a new calendar year of data lands (structural drift, not a one-off fix).
 */
const GRID_EMISSION_FACTORS: Record<Exclude<GridRegion, 'custom'>, number> = {
  US_average: 384,
  EU_average: 210,
  China: 525,
  India: 670,
  Japan: 477,
  Korea: 417,
  UK: 217,
  Germany: 330,
  France: 41,
  Brazil: 110,
  Australia: 525,
  Canada: 191,
};

/**
 * Calculate Scope 2 (indirect) CO2 emissions from purchased electricity — location-based always,
 * market-based additionally when contractual/residual-mix inputs are supplied.
 *
 * @formula location-based: CO2(kg) = kWh × gridFactor / 1000
 * @formula market-based: CO2(kg) = (contractedKwh × supplierFactor + (kWh − contractedKwh) × residualMixFactor) / 1000
 * @reference GHG Protocol Scope 2, Our World in Data / Ember Yearly Electricity Data 2025 (location-based grid factors, see `GRID_EMISSION_FACTORS` above);
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
