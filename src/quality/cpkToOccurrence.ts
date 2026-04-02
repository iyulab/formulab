import type { CpkToOccurrenceInput, CpkToOccurrenceResult } from './types.js';

/**
 * Map Cpk (Process Capability Index) to FMEA Occurrence rating
 *
 * Based on AIAG-VDA FMEA Handbook correlation between process capability
 * and occurrence likelihood.
 *
 * @reference AIAG & VDA (2019). "FMEA Handbook", 1st Edition, Table O-1.
 *
 * @throws {RangeError} Cpk must be a non-negative number
 */
export function cpkToOccurrence(input: CpkToOccurrenceInput): CpkToOccurrenceResult {
  const { cpk } = input;

  if (!Number.isFinite(cpk) || cpk < 0) {
    throw new RangeError('Cpk must be a non-negative number');
  }

  const entry = CPK_TABLE.find(row => cpk >= row.threshold)!;

  return {
    occurrence: entry.occurrence,
    description: entry.description,
    cpkRange: entry.cpkRange,
  };
}

const CPK_TABLE: { threshold: number; occurrence: number; description: string; cpkRange: string }[] = [
  { threshold: 2.00, occurrence: 1,  description: 'Remote: Failure unlikely',                    cpkRange: '>= 2.00' },
  { threshold: 1.67, occurrence: 2,  description: 'Very low: Few failures',                      cpkRange: '1.67 - 1.99' },
  { threshold: 1.33, occurrence: 3,  description: 'Low: Relatively few failures',                cpkRange: '1.33 - 1.66' },
  { threshold: 1.00, occurrence: 4,  description: 'Moderately low: Occasional failures',         cpkRange: '1.00 - 1.32' },
  { threshold: 0.83, occurrence: 5,  description: 'Moderate: Medium number of failures',         cpkRange: '0.83 - 0.99' },
  { threshold: 0.67, occurrence: 6,  description: 'Moderately high: Frequent failures',          cpkRange: '0.67 - 0.82' },
  { threshold: 0.51, occurrence: 7,  description: 'High: Many failures',                         cpkRange: '0.51 - 0.66' },
  { threshold: 0.33, occurrence: 8,  description: 'Very high: Repeated failures',                cpkRange: '0.33 - 0.50' },
  { threshold: 0.17, occurrence: 9,  description: 'Extremely high: Persistent failures',         cpkRange: '0.17 - 0.32' },
  { threshold: -Infinity, occurrence: 10, description: 'Almost certain: Failure is inevitable',   cpkRange: '< 0.17' },
];
