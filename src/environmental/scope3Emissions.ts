import { roundTo, requireFinite } from '../utils.js';
import type { Scope3Category, Scope3EmissionsInput, Scope3EmissionsResult } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Spend-based EEIO emission factors (kgCO2eq per USD)
 * @reference US EPA EEIO model, GHG Protocol Scope 3 Category guidance
 */
const SPEND_BASED_FACTORS: Record<Scope3Category, number> = {
  purchasedGoods: 0.41,      // Manufacturing average
  capitalGoods: 0.35,        // Industrial machinery
  fuelEnergy: 0.50,          // Upstream fuel extraction/refining
  transportation: 0.58,      // Freight and distribution
  waste: 0.25,               // Waste treatment
  businessTravel: 0.45,      // Air/ground travel
  employeeCommuting: 0.30,   // Average commute
  leasedAssets: 0.20,        // Office/facility leasing
};

/**
 * Calculate Scope 3 (value chain) CO2 emissions using spend-based EEIO method
 *
 * @formula CO2eq = spend × EEIO factor
 * @reference GHG Protocol Scope 3 Standard, EPA EEIO model
 * @param input - Scope 3 category and spend amount
 * @returns CO2eq emissions in kg and tonnes
 * @throws {RangeError} spendUsd is negative
 */
export function scope3Emissions(input: Scope3EmissionsInput): Scope3EmissionsResult {
  requireFinite('scope3Emissions', input);
  const { category, spendUsd } = input;

  // A negative spend (a refund) would report a negative emission; offsets are outside this model.
  if (!(spendUsd >= 0)) {
    throw new InputRangeError('spendUsd must not be negative', {
      code: 'parameter_out_of_range', parameter: 'spendUsd', min: 0, got: spendUsd,
    });
  }
  const eeioFactor = SPEND_BASED_FACTORS[category];

  const co2Kg = roundTo(spendUsd * eeioFactor, 2);
  const co2Tonnes = roundTo(co2Kg / 1000, 4);

  return {
    co2Kg,
    co2Tonnes,
    category,
    eeioFactor,
  };
}
