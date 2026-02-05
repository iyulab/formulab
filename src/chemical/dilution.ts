import type { DilutionInput, DilutionResult } from './types.js';

/**
 * Calculate dilution using C1V1 = C2V2 equation.
 *
 * Solves for the specified unknown variable while the other three are provided.
 *
 * @param input - Dilution input with three known values and one to solve for
 * @returns Dilution result with all values and solvent to add
 * @throws Error if division by zero would occur
 */
export function dilution(input: DilutionInput): DilutionResult {
  const { solveFor, c1, v1, c2, v2 } = input;

  let resultC1: number;
  let resultV1: number;
  let resultC2: number;
  let resultV2: number;

  switch (solveFor) {
    case 'c2':
      // C2 = C1 * V1 / V2
      if (v2 === undefined || v2 === 0) {
        throw new Error('Cannot solve for c2: v2 must be non-zero');
      }
      resultC1 = c1!;
      resultV1 = v1!;
      resultV2 = v2;
      resultC2 = (c1! * v1!) / v2;
      break;

    case 'v2':
      // V2 = C1 * V1 / C2
      if (c2 === undefined || c2 === 0) {
        throw new Error('Cannot solve for v2: c2 must be non-zero');
      }
      resultC1 = c1!;
      resultV1 = v1!;
      resultC2 = c2;
      resultV2 = (c1! * v1!) / c2;
      break;

    case 'c1':
      // C1 = C2 * V2 / V1
      if (v1 === undefined || v1 === 0) {
        throw new Error('Cannot solve for c1: v1 must be non-zero');
      }
      resultV1 = v1;
      resultC2 = c2!;
      resultV2 = v2!;
      resultC1 = (c2! * v2!) / v1;
      break;

    case 'v1':
      // V1 = C2 * V2 / C1
      if (c1 === undefined || c1 === 0) {
        throw new Error('Cannot solve for v1: c1 must be non-zero');
      }
      resultC1 = c1;
      resultC2 = c2!;
      resultV2 = v2!;
      resultV1 = (c2! * v2!) / c1;
      break;

    default:
      throw new Error(`Unknown solveFor value: ${solveFor}`);
  }

  return {
    c1: resultC1,
    v1: resultV1,
    c2: resultC2,
    v2: resultV2,
    solventToAdd: resultV2 - resultV1,
  };
}
