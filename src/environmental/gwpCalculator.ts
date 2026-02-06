import { roundTo } from '../utils.js';
import type { GhgGas, GwpTimeHorizon, GwpCalculatorInput, GwpCalculatorResult } from './types.js';

/**
 * Global Warming Potential factors
 * @reference IPCC AR6 (2021), WGI Table 7.SM.7
 */
const GWP_TABLE: Record<GhgGas, Record<GwpTimeHorizon, number>> = {
  CO2:     { GWP20: 1,     GWP100: 1,     GWP500: 1 },
  CH4:     { GWP20: 82.5,  GWP100: 29.8,  GWP500: 7.6 },
  N2O:     { GWP20: 273,   GWP100: 273,   GWP500: 130 },
  HFC134a: { GWP20: 4144,  GWP100: 1526,  GWP500: 436 },
  HFC152a: { GWP20: 591,   GWP100: 164,   GWP500: 44 },
  SF6:     { GWP20: 18300, GWP100: 25200, GWP500: 34100 },
  NF3:     { GWP20: 13400, GWP100: 17400, GWP500: 20700 },
  CF4:     { GWP20: 5300,  GWP100: 7380,  GWP500: 10600 },
};

/**
 * Convert greenhouse gas emissions to CO2 equivalent using GWP factors
 *
 * @formula CO2eq = quantity × GWP factor
 * @reference IPCC AR6 (2021)
 * @param input - Gas type, quantity, and time horizon
 * @returns CO2 equivalent in kg and tonnes
 */
export function gwpCalculator(input: GwpCalculatorInput): GwpCalculatorResult {
  const { gas, quantityKg, timeHorizon = 'GWP100' } = input;

  const gwpFactor = GWP_TABLE[gas][timeHorizon];
  const co2eqKg = roundTo(quantityKg * gwpFactor, 2);
  const co2eqTonnes = roundTo(co2eqKg / 1000, 4);

  return { co2eqKg, co2eqTonnes, gwpFactor, gas, timeHorizon };
}
