import type { ConcentrationInput, ConcentrationResult } from './types.js';

/**
 * Convert concentration between mol/L, wt%, and ppm.
 *
 * Formulas:
 * - mol/L = (wt% * density * 1000) / (MW * 100)
 * - wt% = (mol/L * MW * 100) / (density * 1000)
 * - ppm = wt% * 10000
 * - mol/L = (ppm * density) / (MW * 1000)
 *
 * @param input - Concentration input with source unit, value, molecular weight, and density
 * @returns All three concentration units
 */
export function concentration(input: ConcentrationInput): ConcentrationResult {
  const { fromUnit, value, molecularWeight, solutionDensity } = input;

  let molPerL: number;
  let wtPercent: number;
  let ppm: number;

  switch (fromUnit) {
    case 'molPerL':
      molPerL = value;
      // wt% = (mol/L * MW) / (density * 10)
      wtPercent = (molPerL * molecularWeight) / (solutionDensity * 10);
      // ppm = wt% * 10000
      ppm = wtPercent * 10000;
      break;

    case 'wtPercent':
      wtPercent = value;
      // ppm = wt% * 10000
      ppm = wtPercent * 10000;
      // mol/L = (wt% * density * 1000) / (MW * 100)
      molPerL = (wtPercent * solutionDensity * 1000) / (molecularWeight * 100);
      break;

    case 'ppm':
      ppm = value;
      // wt% = ppm / 10000
      wtPercent = ppm / 10000;
      // mol/L = (ppm * density) / (MW * 1000)
      molPerL = (ppm * solutionDensity) / (molecularWeight * 1000);
      break;

    default:
      return { molPerL: 0, wtPercent: 0, ppm: 0 };
  }

  return { molPerL, wtPercent, ppm };
}
