import type { HardnessScale, HardnessInput, HardnessResult } from './types.js';

interface ConversionRow {
  HRC: number;
  HB: number;
  HV: number;
  Shore: number;
}

// ASTM E140-12b conversion table for non-austenitic steels
// HB values use tungsten carbide ball; HB not defined above HRC ~65 (capped at 739)
export const CONVERSION_TABLE: ConversionRow[] = [
  { HRC: 68, HB: 739, HV: 940, Shore: 97 },
  { HRC: 65, HB: 739, HV: 832, Shore: 91 },
  { HRC: 60, HB: 613, HV: 697, Shore: 81 },
  { HRC: 55, HB: 560, HV: 595, Shore: 75 },
  { HRC: 50, HB: 481, HV: 513, Shore: 68 },
  { HRC: 45, HB: 421, HV: 446, Shore: 62 },
  { HRC: 40, HB: 371, HV: 392, Shore: 56 },
  { HRC: 35, HB: 327, HV: 345, Shore: 51 },
  { HRC: 30, HB: 286, HV: 302, Shore: 45 },
  { HRC: 25, HB: 253, HV: 266, Shore: 40 },
  { HRC: 20, HB: 226, HV: 238, Shore: 36 },
];

/**
 * Linear interpolation between two conversion rows based on a given scale value.
 */
function interpolate(
  scale: HardnessScale,
  value: number,
  low: ConversionRow,
  high: ConversionRow,
): HardnessResult {
  const t = (value - low[scale]) / (high[scale] - low[scale]);
  return {
    HRC: roundTo(low.HRC + t * (high.HRC - low.HRC), 1),
    HB: roundTo(low.HB + t * (high.HB - low.HB), 0),
    HV: roundTo(low.HV + t * (high.HV - low.HV), 0),
    Shore: roundTo(low.Shore + t * (high.Shore - low.Shore), 1),
  };
}

/**
 * Convert a hardness value from one scale to all scales using
 * linear interpolation on the conversion table.
 */
export function hardness(input: HardnessInput): HardnessResult {
  const { fromScale, value } = input;

  // Sort table by the source scale ascending
  const sorted = [...CONVERSION_TABLE].sort((a, b) => a[fromScale] - b[fromScale]);

  // Clamp: if value is at or below the minimum row
  if (value <= sorted[0][fromScale]) {
    const row = sorted[0];
    return {
      HRC: row.HRC,
      HB: row.HB,
      HV: row.HV,
      Shore: row.Shore,
    };
  }

  // Clamp: if value is at or above the maximum row
  if (value >= sorted[sorted.length - 1][fromScale]) {
    const row = sorted[sorted.length - 1];
    return {
      HRC: row.HRC,
      HB: row.HB,
      HV: row.HV,
      Shore: row.Shore,
    };
  }

  // Find the two bracketing rows
  for (let i = 0; i < sorted.length - 1; i++) {
    const low = sorted[i];
    const high = sorted[i + 1];
    if (value >= low[fromScale] && value <= high[fromScale]) {
      return interpolate(fromScale, value, low, high);
    }
  }

  // Fallback (should not reach here)
  const row = sorted[0];
  return {
    HRC: row.HRC,
    HB: row.HB,
    HV: row.HV,
    Shore: row.Shore,
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
