import type { ConcentrationInput, ConcentrationResult } from './types.js';
import { requireFinite, roundTo } from '../utils.js';
import { inputRangeError } from '../errors.js';

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
 * @throws {RangeError} fromUnit is not molPerL, wtPercent or ppm, value is negative or more than
 *   100 wt% (10⁶ ppm, or a molarity implying it), or
 *   molecularWeight or solutionDensity is not greater than 0
 */
export function concentration(input: ConcentrationInput): ConcentrationResult {
  requireFinite('concentration', input);
  const { fromUnit, value, molecularWeight, solutionDensity } = input;

  // A concentration is an amount of solute; a negative one converts to negative values in every unit.
  if (!(value >= 0)) {
    throw inputRangeError('value must not be negative', {
      code: 'parameter_out_of_range', parameter: 'value', min: 0, got: value,
    });
  }
  // Every conversion below divides by one or both of these, so a non-positive value
  // returns an infinite concentration rather than describing a solution.
  if (!(molecularWeight > 0)) {
    throw inputRangeError('molecularWeight must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'molecularWeight', exclusive_min: 0, got: molecularWeight,
    });
  }
  if (!(solutionDensity > 0)) {
    throw inputRangeError('solutionDensity must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'solutionDensity', exclusive_min: 0, got: solutionDensity,
    });
  }

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

    default: {
      // Unreachable for typed callers; untyped form/API data gets an error, not a zero-filled result.
      const unknownUnit: never = fromUnit;
      throw inputRangeError(`fromUnit must be molPerL, wtPercent or ppm, got ${String(unknownUnit)}`, {
        code: 'unknown_option', parameter: 'fromUnit', got: String(unknownUnit),
      });
    }
  }

  // A solution cannot hold more solute than its own mass (100 wt% = 10⁶ ppm); a molarity that
  // implies it describes a density or molecular weight that does not belong to this solution.
  if (wtPercent > 100) {
    throw new RangeError(`value describes ${roundTo(wtPercent, 2)} wt% solute — a solution holds at most 100 wt% (10⁶ ppm)`);
  }

  return { molPerL, wtPercent, ppm };
}
