import type { ResistorBands, ResistorResult, ColorName } from './types.js';

/**
 * Color code values for resistor bands
 */
const COLOR_VALUES: Record<ColorName, number> = {
  black: 0,
  brown: 1,
  red: 2,
  orange: 3,
  yellow: 4,
  green: 5,
  blue: 6,
  violet: 7,
  grey: 8,
  white: 9,
  gold: -1,   // used for multiplier (0.1) and tolerance (5%)
  silver: -2, // used for multiplier (0.01) and tolerance (10%)
};

/**
 * Multiplier values for each color
 */
const MULTIPLIERS: Record<ColorName, number> = {
  black: 1,
  brown: 10,
  red: 100,
  orange: 1000,
  yellow: 10000,
  green: 100000,
  blue: 1000000,
  violet: 10000000,
  grey: 100000000,
  white: 1000000000,
  gold: 0.1,
  silver: 0.01,
};

/**
 * Tolerance values for each color (percentage)
 */
const TOLERANCES: Record<string, number> = {
  brown: 1,
  red: 2,
  green: 0.5,
  blue: 0.25,
  violet: 0.1,
  grey: 0.05,
  gold: 5,
  silver: 10,
};

/**
 * Temperature coefficient values (ppm/C) for 6-band resistors
 */
const TEMP_COEFFICIENTS: Record<string, number> = {
  black: 250,
  brown: 100,
  red: 50,
  orange: 15,
  yellow: 25,
  green: 20,
  blue: 10,
  violet: 5,
  grey: 1,
};

/**
 * Format resistance value with appropriate unit (Ohm, kOhm, MOhm)
 */
function formatResistance(resistance: number, tolerance: number, tempCoeff?: number): string {
  let value: string;
  let unit: string;

  if (resistance >= 1000000) {
    value = (resistance / 1000000).toString();
    if (value.includes('.') && value.split('.')[1].length > 2) {
      value = (resistance / 1000000).toFixed(2).replace(/\.?0+$/, '');
    }
    unit = 'M\u03A9';
  } else if (resistance >= 1000) {
    value = (resistance / 1000).toString();
    if (value.includes('.') && value.split('.')[1].length > 2) {
      value = (resistance / 1000).toFixed(2).replace(/\.?0+$/, '');
    }
    unit = 'k\u03A9';
  } else {
    value = resistance.toString();
    unit = '\u03A9';
  }

  let formatted = `${value}${unit} \u00B1${tolerance}%`;

  if (tempCoeff !== undefined) {
    formatted += ` ${tempCoeff}ppm/\u00B0C`;
  }

  return formatted;
}

/**
 * Decode resistor color bands to get resistance value
 * @param input - Resistor band information (count and colors)
 * @returns Decoded resistance, tolerance, and formatted string
 */
export function resistorDecode(input: ResistorBands): ResistorResult {
  const { bandCount, bands } = input;

  let resistance: number;
  let tolerance: number;
  let tempCoeff: number | undefined;

  if (bandCount === 4) {
    // 4-band: digit1, digit2, multiplier, tolerance
    const digit1 = COLOR_VALUES[bands[0]];
    const digit2 = COLOR_VALUES[bands[1]];
    const multiplier = MULTIPLIERS[bands[2]];
    tolerance = TOLERANCES[bands[3]] ?? 20;

    resistance = (digit1 * 10 + digit2) * multiplier;
  } else if (bandCount === 5) {
    // 5-band: digit1, digit2, digit3, multiplier, tolerance
    const digit1 = COLOR_VALUES[bands[0]];
    const digit2 = COLOR_VALUES[bands[1]];
    const digit3 = COLOR_VALUES[bands[2]];
    const multiplier = MULTIPLIERS[bands[3]];
    tolerance = TOLERANCES[bands[4]] ?? 20;

    resistance = (digit1 * 100 + digit2 * 10 + digit3) * multiplier;
  } else {
    // 6-band: digit1, digit2, digit3, multiplier, tolerance, tempCoeff
    const digit1 = COLOR_VALUES[bands[0]];
    const digit2 = COLOR_VALUES[bands[1]];
    const digit3 = COLOR_VALUES[bands[2]];
    const multiplier = MULTIPLIERS[bands[3]];
    tolerance = TOLERANCES[bands[4]] ?? 20;
    tempCoeff = TEMP_COEFFICIENTS[bands[5]];

    resistance = (digit1 * 100 + digit2 * 10 + digit3) * multiplier;
  }

  const formatted = formatResistance(resistance, tolerance, tempCoeff);

  return {
    resistance,
    tolerance,
    tempCoeff,
    formatted,
  };
}
