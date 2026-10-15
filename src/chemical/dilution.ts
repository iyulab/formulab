import type { DilutionInput, DilutionResult } from './types.js';
import { requireFinite } from '../utils.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate dilution using C1V1 = C2V2 equation.
 *
 * Solves for the specified unknown variable while the other three are provided.
 *
 * @param input - Dilution input with three known values and one to solve for
 * @returns Dilution result with all values and solvent to add
 * @throws {RangeError} any of the three given concentrations or volumes is not greater than 0
 */
export function dilution(input: DilutionInput): DilutionResult {
  requireFinite('dilution', input);
  let resultC1: number;
  let resultV1: number;
  let resultC2: number;
  let resultV2: number;

  // Every case divides by one of the given values, and a negative concentration or volume
  // returns a negative unknown rather than describing a dilution.
  switch (input.solveFor) {
    case 'c2':
      // C2 = C1 * V1 / V2
      resultC1 = requirePositive(input.c1, 'c1');
      resultV1 = requirePositive(input.v1, 'v1');
      resultV2 = requirePositive(input.v2, 'v2');
      resultC2 = (resultC1 * resultV1) / resultV2;
      break;

    case 'v2':
      // V2 = C1 * V1 / C2
      resultC1 = requirePositive(input.c1, 'c1');
      resultV1 = requirePositive(input.v1, 'v1');
      resultC2 = requirePositive(input.c2, 'c2');
      resultV2 = (resultC1 * resultV1) / resultC2;
      break;

    case 'c1':
      // C1 = C2 * V2 / V1
      resultV1 = requirePositive(input.v1, 'v1');
      resultC2 = requirePositive(input.c2, 'c2');
      resultV2 = requirePositive(input.v2, 'v2');
      resultC1 = (resultC2 * resultV2) / resultV1;
      break;

    case 'v1':
      // V1 = C2 * V2 / C1
      resultC1 = requirePositive(input.c1, 'c1');
      resultC2 = requirePositive(input.c2, 'c2');
      resultV2 = requirePositive(input.v2, 'v2');
      resultV1 = (resultC2 * resultV2) / resultC1;
      break;
  }

  return {
    c1: resultC1,
    v1: resultV1,
    c2: resultC2,
    v2: resultV2,
    solventToAdd: resultV2 - resultV1,
  };
}

function requirePositive(value: number, name: string): number {
  if (!(value > 0)) {
    throw new InputRangeError(`${name} must be greater than 0`, {
      code: 'parameter_out_of_range', parameter: name, exclusive_min: 0, got: value,
    });
  }
  return value;
}
