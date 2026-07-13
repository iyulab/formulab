import { roundTo } from '../utils.js';
import type { AqlInput, AqlResult, InspectionLevel } from './types.js';

// Sample size code letters — ISO 2859-1:1999 Table 1 / ANSI Z1.4 Table I
const LOT_SIZE_RANGES: Array<{ max: number; codes: Record<InspectionLevel, string> }> = [
  { max: 8, codes: { 'S-1': 'A', 'S-2': 'A', 'S-3': 'A', 'S-4': 'A', 'I': 'A', 'II': 'A', 'III': 'B' } },
  { max: 15, codes: { 'S-1': 'A', 'S-2': 'A', 'S-3': 'A', 'S-4': 'A', 'I': 'A', 'II': 'B', 'III': 'C' } },
  { max: 25, codes: { 'S-1': 'A', 'S-2': 'A', 'S-3': 'B', 'S-4': 'B', 'I': 'B', 'II': 'C', 'III': 'D' } },
  { max: 50, codes: { 'S-1': 'A', 'S-2': 'B', 'S-3': 'B', 'S-4': 'C', 'I': 'C', 'II': 'D', 'III': 'E' } },
  { max: 90, codes: { 'S-1': 'B', 'S-2': 'B', 'S-3': 'C', 'S-4': 'C', 'I': 'C', 'II': 'E', 'III': 'F' } },
  { max: 150, codes: { 'S-1': 'B', 'S-2': 'B', 'S-3': 'C', 'S-4': 'D', 'I': 'D', 'II': 'F', 'III': 'G' } },
  { max: 280, codes: { 'S-1': 'B', 'S-2': 'C', 'S-3': 'D', 'S-4': 'E', 'I': 'E', 'II': 'G', 'III': 'H' } },
  { max: 500, codes: { 'S-1': 'B', 'S-2': 'C', 'S-3': 'D', 'S-4': 'E', 'I': 'F', 'II': 'H', 'III': 'J' } },
  { max: 1200, codes: { 'S-1': 'C', 'S-2': 'C', 'S-3': 'E', 'S-4': 'F', 'I': 'G', 'II': 'J', 'III': 'K' } },
  { max: 3200, codes: { 'S-1': 'C', 'S-2': 'D', 'S-3': 'E', 'S-4': 'G', 'I': 'H', 'II': 'K', 'III': 'L' } },
  { max: 10000, codes: { 'S-1': 'C', 'S-2': 'D', 'S-3': 'F', 'S-4': 'G', 'I': 'J', 'II': 'L', 'III': 'M' } },
  { max: 35000, codes: { 'S-1': 'C', 'S-2': 'D', 'S-3': 'F', 'S-4': 'H', 'I': 'K', 'II': 'M', 'III': 'N' } },
  { max: 150000, codes: { 'S-1': 'D', 'S-2': 'E', 'S-3': 'G', 'S-4': 'J', 'I': 'L', 'II': 'N', 'III': 'P' } },
  { max: 500000, codes: { 'S-1': 'D', 'S-2': 'E', 'S-3': 'G', 'S-4': 'J', 'I': 'M', 'II': 'P', 'III': 'Q' } },
  { max: Infinity, codes: { 'S-1': 'D', 'S-2': 'E', 'S-3': 'H', 'S-4': 'K', 'I': 'N', 'II': 'Q', 'III': 'R' } },
];

// Sample sizes for each code letter
const SAMPLE_SIZES: Record<string, number> = {
  A: 2, B: 3, C: 5, D: 8, E: 13, F: 20, G: 32, H: 50,
  J: 80, K: 125, L: 200, M: 315, N: 500, P: 800, Q: 1250, R: 2000,
};

// Accept/Reject numbers — ISO 2859-1:1999 Table 2-A (single sampling, normal inspection)
// Format: { [sampleCode]: { [aql]: [accept, reject] } }
// Simplification: the sample size stays fixed per code letter; where Table 2-A has an
// arrow (use the adjacent plan with a different sample size), the arrow's Ac/Re pair is
// used with this letter's sample size instead.
const AQL_TABLE: Record<string, Record<number, [number, number]>> = {
  A: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [0, 1], 0.4: [0, 1], 0.65: [0, 1], 1.0: [0, 1], 1.5: [0, 1], 2.5: [0, 1], 4.0: [0, 1], 6.5: [0, 1] },
  B: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [0, 1], 0.4: [0, 1], 0.65: [0, 1], 1.0: [0, 1], 1.5: [0, 1], 2.5: [0, 1], 4.0: [0, 1], 6.5: [0, 1] },
  C: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [0, 1], 0.4: [0, 1], 0.65: [0, 1], 1.0: [0, 1], 1.5: [0, 1], 2.5: [0, 1], 4.0: [0, 1], 6.5: [1, 2] },
  D: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [0, 1], 0.4: [0, 1], 0.65: [0, 1], 1.0: [0, 1], 1.5: [0, 1], 2.5: [0, 1], 4.0: [1, 2], 6.5: [1, 2] },
  E: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [0, 1], 0.4: [0, 1], 0.65: [0, 1], 1.0: [0, 1], 1.5: [0, 1], 2.5: [1, 2], 4.0: [1, 2], 6.5: [2, 3] },
  F: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [0, 1], 0.4: [0, 1], 0.65: [0, 1], 1.0: [0, 1], 1.5: [1, 2], 2.5: [1, 2], 4.0: [2, 3], 6.5: [3, 4] },
  G: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [0, 1], 0.4: [0, 1], 0.65: [0, 1], 1.0: [1, 2], 1.5: [1, 2], 2.5: [2, 3], 4.0: [3, 4], 6.5: [5, 6] },
  H: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [0, 1], 0.4: [0, 1], 0.65: [1, 2], 1.0: [1, 2], 1.5: [2, 3], 2.5: [3, 4], 4.0: [5, 6], 6.5: [7, 8] },
  J: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [0, 1], 0.4: [1, 2], 0.65: [1, 2], 1.0: [2, 3], 1.5: [3, 4], 2.5: [5, 6], 4.0: [7, 8], 6.5: [10, 11] },
  K: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [0, 1], 0.25: [1, 2], 0.4: [1, 2], 0.65: [2, 3], 1.0: [3, 4], 1.5: [5, 6], 2.5: [7, 8], 4.0: [10, 11], 6.5: [14, 15] },
  L: { 0.065: [0, 1], 0.1: [0, 1], 0.15: [1, 2], 0.25: [1, 2], 0.4: [2, 3], 0.65: [3, 4], 1.0: [5, 6], 1.5: [7, 8], 2.5: [10, 11], 4.0: [14, 15], 6.5: [21, 22] },
  M: { 0.065: [0, 1], 0.1: [1, 2], 0.15: [1, 2], 0.25: [2, 3], 0.4: [3, 4], 0.65: [5, 6], 1.0: [7, 8], 1.5: [10, 11], 2.5: [14, 15], 4.0: [21, 22], 6.5: [21, 22] },
  N: { 0.065: [1, 2], 0.1: [1, 2], 0.15: [2, 3], 0.25: [3, 4], 0.4: [5, 6], 0.65: [7, 8], 1.0: [10, 11], 1.5: [14, 15], 2.5: [21, 22], 4.0: [21, 22], 6.5: [21, 22] },
  P: { 0.065: [1, 2], 0.1: [2, 3], 0.15: [3, 4], 0.25: [5, 6], 0.4: [7, 8], 0.65: [10, 11], 1.0: [14, 15], 1.5: [21, 22], 2.5: [21, 22], 4.0: [21, 22], 6.5: [21, 22] },
  Q: { 0.065: [2, 3], 0.1: [3, 4], 0.15: [5, 6], 0.25: [7, 8], 0.4: [10, 11], 0.65: [14, 15], 1.0: [21, 22], 1.5: [21, 22], 2.5: [21, 22], 4.0: [21, 22], 6.5: [21, 22] },
  R: { 0.065: [3, 4], 0.1: [5, 6], 0.15: [7, 8], 0.25: [10, 11], 0.4: [14, 15], 0.65: [21, 22], 1.0: [21, 22], 1.5: [21, 22], 2.5: [21, 22], 4.0: [21, 22], 6.5: [21, 22] },
};

function getSampleCode(lotSize: number, inspectionLevel: InspectionLevel): string {
  for (const range of LOT_SIZE_RANGES) {
    if (lotSize <= range.max) {
      return range.codes[inspectionLevel];
    }
  }
  return 'A'; // fallback
}

function getAcceptReject(
  sampleCode: string, aqlLevel: number
): { acceptNumber: number; rejectNumber: number; aqlUsed: number } {
  const codeTable = AQL_TABLE[sampleCode];

  // Snap to the nearest table column at or below the requested AQL (or the lowest column
  // when the request is below the table). The embedded table only covers 0.065-6.5, while
  // ISO 2859-1 defines AQLs from 0.010 up to 1000 — so realistic requests (AQL 10, AQL 0.01)
  // get a plan for a DIFFERENT quality level. `aqlUsed` reports which column was applied;
  // the caller compares it against the request via `aqlAdjusted`.
  const aqlLevels = Object.keys(codeTable).map(Number).sort((a, b) => a - b);
  let selectedAql = aqlLevels[0];

  for (const level of aqlLevels) {
    if (level <= aqlLevel) {
      selectedAql = level;
    }
  }

  const [acceptNumber, rejectNumber] = codeTable[selectedAql];
  return { acceptNumber, rejectNumber, aqlUsed: selectedAql };
}

/**
 * Calculate AQL (Acceptable Quality Level) sampling plan
 *
 * @reference ISO 2859-1:1999, Table 1 (sample size code letters) and Table 2-A
 *   (single sampling plans for normal inspection). Equivalent to ANSI/ASQ Z1.4.
 * @remarks Simplified relative to the standard: the sample size is always the code
 *   letter's own size — Table 2-A arrow cells (which redirect to a plan with a
 *   different sample size) reuse the redirected plan's Ac/Re with this letter's size.
 * @remarks The embedded table covers AQL columns 0.065–6.5 only, while ISO 2859-1
 *   defines 0.010–1000. A request outside (or between) the embedded columns is snapped
 *   to the nearest column at or below it (or up to 0.065 from below) and disclosed via
 *   `aqlUsed` / `aqlAdjusted` — the returned plan is then for a different quality level
 *   than requested.
 *
 * @param input - AQL input parameters
 * @returns AQL sampling plan result
 */
export function aql(input: AqlInput): AqlResult {
  const { lotSize, aqlLevel, inspectionLevel } = input;

  // Guard against invalid lot size
  if (lotSize <= 0) {
    throw new RangeError('lotSize must be greater than 0');
  }

  // Handle invalid AQL level
  if (aqlLevel < 0) {
    return {
      sampleCode: '-',
      sampleSize: 0,
      acceptNumber: 0,
      rejectNumber: 1,
      samplingPercent: 0,
      aqlUsed: 0,
      aqlAdjusted: true,
    };
  }

  const sampleCode = getSampleCode(lotSize, inspectionLevel);
  const sampleSize = SAMPLE_SIZES[sampleCode] ?? 2;
  const { acceptNumber, rejectNumber, aqlUsed } = getAcceptReject(sampleCode, aqlLevel);

  // Ensure sample size doesn't exceed lot size
  const effectiveSampleSize = Math.min(sampleSize, lotSize);
  const samplingPercent = roundTo((effectiveSampleSize / lotSize) * 100, 2);

  return {
    sampleCode,
    sampleSize: effectiveSampleSize,
    acceptNumber,
    rejectNumber,
    samplingPercent,
    aqlUsed,
    aqlAdjusted: aqlUsed !== aqlLevel,
  };
}
