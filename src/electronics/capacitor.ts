import type { CapacitorCodeInput, CapacitorCodeResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Round to specified decimal places
 */

/**
 * Decode a 3-digit capacitor code to capacitance values
 * @param input - The 3-digit capacitor code (e.g., "104")
 * @returns Capacitance in pF, nF, and µF with formatted output
 * @throws Error if code is invalid
 */
export function capacitorDecode(input: CapacitorCodeInput): CapacitorCodeResult {
  const { code } = input;

  // Validate: must be exactly 3 digits
  if (!/^\d{3}$/.test(code)) {
    throw new Error('Invalid capacitor code: must be exactly 3 digits');
  }

  const digit1 = parseInt(code[0], 10);
  const digit2 = parseInt(code[1], 10);
  const multiplierDigit = parseInt(code[2], 10);

  // Significant figures from first two digits
  const significantFigures = digit1 * 10 + digit2;

  // Multiplier is 10^n picofarads
  const multiplier = Math.pow(10, multiplierDigit);

  // Value in picofarads
  const picofarads = significantFigures * multiplier;
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
