import type { ToleranceInput, ToleranceResult } from './types.js';

// Size ranges [min, max] in mm
const SIZE_RANGES: [number, number][] = [
  [0, 3], [3, 6], [6, 10], [10, 18], [18, 30], [30, 50],
  [50, 80], [80, 120], [120, 180], [180, 250], [250, 315], [315, 400],
];

// IT grade multipliers (IT5 to IT14)
const IT_MULTIPLIERS: Record<number, number> = {
  5: 7, 6: 10, 7: 16, 8: 25, 9: 40, 10: 64, 11: 100, 12: 160, 13: 250, 14: 400,
};

// Fundamental deviations in um per size range index
// Positive = material added, Negative = material removed
const FUNDAMENTAL_DEVIATIONS: Record<string, number[]> = {
  // Holes (uppercase) - lower deviation
  'H': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  // Shafts (lowercase) - upper deviation
  'h': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'd': [-20, -30, -40, -50, -65, -80, -100, -120, -145, -170, -190, -210],
  'e': [-14, -20, -25, -32, -40, -50, -60, -72, -85, -100, -110, -125],
  'f': [-6, -10, -13, -16, -20, -25, -30, -36, -43, -50, -56, -62],
  'g': [-2, -4, -5, -6, -7, -9, -10, -12, -14, -15, -17, -18],
  'js': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // symmetric
  'k': [0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4],
  'm': [2, 4, 6, 7, 8, 9, 11, 13, 15, 17, 20, 21],
  'n': [4, 8, 10, 12, 15, 17, 20, 23, 27, 31, 34, 37],
  'p': [6, 12, 15, 18, 22, 26, 32, 37, 43, 50, 56, 62],
};

function getSizeRangeIndex(nominal: number): number {
  for (let i = 0; i < SIZE_RANGES.length; i++) {
    if (nominal > SIZE_RANGES[i][0] && nominal <= SIZE_RANGES[i][1]) return i;
  }
  return -1;
}

function getToleranceValue(nominal: number, itGrade: number): number {
  const idx = getSizeRangeIndex(nominal);
  if (idx < 0) return 0;

  const range = SIZE_RANGES[idx];
  const D = Math.sqrt(range[0] * range[1]) || range[1]; // geometric mean
  const i = 0.45 * Math.cbrt(D) + 0.001 * D; // standard tolerance unit

  const multiplier = IT_MULTIPLIERS[itGrade];
  if (!multiplier) return 0;

  return roundTo(multiplier * i, 1);
}

/**
 * Calculate ISO tolerance band for a given nominal size and tolerance class.
 */
export function tolerance(input: ToleranceInput): ToleranceResult | null {
  const { nominalSize, fitType, deviationLetter, itGrade } = input;

  const idx = getSizeRangeIndex(nominalSize);
  if (idx < 0) return null;

  const toleranceVal = getToleranceValue(nominalSize, itGrade);
  if (toleranceVal === 0) return null;

  const letter = deviationLetter.toLowerCase();
  const deviations = FUNDAMENTAL_DEVIATIONS[letter === 'js' ? 'js' : letter];
  if (!deviations) return null;

  let upperDev: number;
  let lowerDev: number;

  if (letter === 'js') {
    // Symmetric tolerance
    upperDev = toleranceVal / 2;
    lowerDev = -toleranceVal / 2;
  } else if (fitType === 'hole') {
    // Hole basis: fundamental deviation is lower deviation
    const fd = Math.abs(deviations[idx]); // holes always positive or zero
    if (letter === 'h') {
      // H basis: 0 to +tolerance
      lowerDev = 0;
      upperDev = toleranceVal;
    } else {
      lowerDev = fd;
      upperDev = fd + toleranceVal;
    }
  } else {
    // Shaft: fundamental deviation is upper deviation
    const fd = deviations[idx];
    if (letter === 'h') {
      upperDev = 0;
      lowerDev = -toleranceVal;
    } else if (fd <= 0) {
      upperDev = fd;
      lowerDev = fd - toleranceVal;
    } else {
      lowerDev = fd;
      upperDev = fd + toleranceVal;
    }
  }

  const designation = `${nominalSize} ${deviationLetter.toUpperCase() === deviationLetter ? deviationLetter : deviationLetter}${itGrade}`;
  const maxSize = nominalSize + upperDev / 1000;
  const minSize = nominalSize + lowerDev / 1000;

  return {
    designation,
    upperDeviation: roundTo(upperDev, 1),
    lowerDeviation: roundTo(lowerDev, 1),
    maxSize: roundTo(maxSize, 4),
    minSize: roundTo(minSize, 4),
    toleranceBand: roundTo(Math.abs(upperDev - lowerDev), 1),
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
