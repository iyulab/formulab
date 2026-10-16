import type { CapacitorCodeInput, CapacitorCodeResult } from './types.js';
import { roundTo, requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';

/**
 * Decode a 3-digit capacitor code to capacitance values
 *
 * @formula C (pF) = (first two digits) × multiplier; the third digit n gives 10ⁿ for 0–6, and the
 *   fractional multipliers ×0.01 for 8 and ×0.1 for 9 (so "159" is 1.5 pF); 7 is not assigned.
 * @reference EIA-198 / IEC 60062 three-digit capacitance code.
 *
 * @param input - The 3-digit capacitor code (e.g., "104")
 * @returns Capacitance in pF, nF, and µF with formatted output
 * @throws {RangeError} the code is not three digits, or its multiplier digit is 7
 */
export function capacitorDecode(input: CapacitorCodeInput): CapacitorCodeResult {
  requireFinite('capacitorDecode', input);
  const { code } = input;

  // Validate: must be exactly 3 digits
  if (!/^\d{3}$/.test(code)) {
    throw inputRangeError('Invalid capacitor code: must be exactly 3 digits', {
      code: 'unknown_option', parameter: 'code', got: String(code),
    });
  }

  const digit1 = parseInt(code[0], 10);
  const digit2 = parseInt(code[1], 10);
  const multiplierDigit = parseInt(code[2], 10);

  // Significant figures from first two digits
  const significantFigures = digit1 * 10 + digit2;

  // 0–6 are powers of ten; 8 and 9 are the fractional multipliers for values below 10 pF.
  if (multiplierDigit === 7) {
    throw inputRangeError('Invalid capacitor code: multiplier digit 7 is not assigned', {
      code: 'unknown_option', parameter: 'code', got: code,
    });
  }
  const multiplier = multiplierDigit === 8 ? 0.01 : multiplierDigit === 9 ? 0.1 : Math.pow(10, multiplierDigit);

  // Value in picofarads
  const picofarads = roundTo(significantFigures * multiplier, 6);
  const nanofarads = roundTo(picofarads / 1000, 6);
  const microfarads = roundTo(picofarads / 1000000, 6);

  // Format output string
  let formatted: string;
  if (microfarads >= 1) {
    formatted = `${roundTo(microfarads, 3)}\u00B5F`;
  } else if (nanofarads >= 1) {
    formatted = `${roundTo(nanofarads, 3)}nF`;
  } else {
    formatted = `${picofarads}pF`;
  }

  return {
    picofarads,
    nanofarads,
    microfarads,
    formatted,
    significantFigures,
    multiplier,
  };
}
