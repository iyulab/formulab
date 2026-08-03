import { roundTo } from '../utils.js';
import type { ToleranceInput, ToleranceResult } from './types.js';

// Size ranges [min, max] in mm
const SIZE_RANGES: [number, number][] = [
  [0, 3], [3, 6], [6, 10], [10, 18], [18, 30], [30, 50],
  [50, 80], [80, 120], [120, 180], [180, 250], [250, 315], [315, 400],
];

/**
 * Standard tolerance grades in micrometres, one entry per size range above.
 *
 * These are the tabulated grades, not the tolerance unit `i = 0.45·∛D + 0.001·D` the
 * table was derived from. The standard rounds each computed grade to a preferred value,
 * so the two disagree by up to roughly half a micrometre — and not always in the
 * direction ordinary rounding would take: at 6-10 mm the formula gives IT7 = 14.4 while
 * the table reads 15. A calculator that states ISO 286 has to agree with the table.
 *
 * IT4 is carried even though it is below the range offered as an input grade: the
 * deviation rule for K, M, N and P upwards needs the next finer grade, and without IT4
 * those hole zones would quietly lose that term at IT5.
 */
const IT_GRADES: Record<number, number[]> = {
  4: [3, 4, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18],
  5: [4, 5, 6, 8, 9, 11, 13, 15, 18, 20, 23, 25],
  6: [6, 8, 9, 11, 13, 16, 19, 22, 25, 29, 32, 36],
  7: [10, 12, 15, 18, 21, 25, 30, 35, 40, 46, 52, 57],
  8: [14, 18, 22, 27, 33, 39, 46, 54, 63, 72, 81, 89],
  9: [25, 30, 36, 43, 52, 62, 74, 87, 100, 115, 130, 140],
  10: [40, 48, 58, 70, 84, 100, 120, 140, 160, 185, 210, 230],
  11: [60, 75, 90, 110, 130, 160, 190, 220, 250, 290, 320, 360],
  12: [100, 120, 150, 180, 210, 250, 300, 350, 400, 460, 520, 570],
  13: [140, 180, 220, 270, 330, 390, 460, 540, 630, 720, 810, 890],
  14: [250, 300, 360, 430, 520, 620, 740, 870, 1000, 1150, 1300, 1400],
};

// Grades accepted as an input. IT4 exists in the table only to serve the deviation rule.
const MIN_INPUT_GRADE = 5;

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

  const grade = IT_GRADES[itGrade];
  if (!grade) return 0;

  return grade[idx];
}

/**
 * Calculate ISO tolerance band for a given nominal size and tolerance class.
 *
 * @throws RangeError if the nominal size is out of range, the IT grade is unknown,
 *   or the deviation letter is unknown
 */
export function tolerance(input: ToleranceInput): ToleranceResult {
  const { nominalSize, fitType, deviationLetter, itGrade } = input;

  const idx = getSizeRangeIndex(nominalSize);
  if (idx < 0) {
    throw new RangeError('nominal size out of range');
  }

  if (!IT_GRADES[itGrade] || itGrade < MIN_INPUT_GRADE) {
    throw new RangeError('unknown IT grade: ' + itGrade);
  }
  const toleranceVal = getToleranceValue(nominalSize, itGrade);

  const letter = deviationLetter.toLowerCase();
  const deviations = FUNDAMENTAL_DEVIATIONS[letter === 'js' ? 'js' : letter];
  if (!deviations) {
    throw new RangeError('unknown deviation letter: ' + deviationLetter);
  }

  let upperDev: number;
  let lowerDev: number;

  if (letter === 'js') {
    // Symmetric tolerance
    upperDev = toleranceVal / 2;
    lowerDev = -toleranceVal / 2;
  } else if (fitType === 'hole') {
    const fd = deviations[idx];
    if (letter === 'h') {
      // H basis: 0 to +tolerance
      lowerDev = 0;
      upperDev = toleranceVal;
    } else if (fd <= 0) {
      // Letters a-h: the hole deviation mirrors the shaft one, EI = -es. Since es is
      // negative or zero for these letters, EI comes out positive and the hole sits
      // entirely above nominal.
      lowerDev = -fd;
      upperDev = -fd + toleranceVal;
    } else {
      // Letters j-zc: ES = -ei + delta, EI = ES - IT (ISO 286-1). The delta term is
      // what keeps a hole class usable against the shaft class one grade finer -- it is
      // the difference between this grade and the next finer one. Without it the zone
      // lands in the wrong place entirely, and because the result still looks like a
      // plausible pair of micrometre figures nothing downstream can notice.
      //
      // ISO 286-1 applies delta to K/M/N through IT8 and to P and beyond through IT7;
      // above those grades delta is zero.
      const deltaApplies = ['k', 'm', 'n'].includes(letter) ? itGrade <= 8 : itGrade <= 7;
      const finer = deltaApplies ? getToleranceValue(nominalSize, itGrade - 1) : 0;
      const delta = deltaApplies && finer > 0 ? toleranceVal - finer : 0;
      upperDev = -fd + delta;
      lowerDev = upperDev - toleranceVal;
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
