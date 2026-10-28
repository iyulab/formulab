import type { CpkToOccurrenceInput, CpkToOccurrenceResult } from './types.js';
import { requireFinite, roundTo } from '../utils.js';
import { inputRangeError } from '../errors.js';
import { normalCDF, normalInvCDF } from '../math.js';

/**
 * Map Cpk (Process Capability Index) to a PFMEA Occurrence rating
 *
 * The AIAG & VDA FMEA Handbook rates process occurrence by the effectiveness of the prevention
 * controls (Table P2) and offers an alternative table keyed on the number of incidents per 1,000
 * items. It has no Cpk column. This function goes through the alternative table: the Cpk is
 * turned into the expected nonconforming fraction of a normal process, `2·Φ(−3·Cpk)` — the upper
 * bound when only the Cpk is known, exact for a centered process — and that fraction is rated
 * against the table's incidents per 1,000.
 *
 * Reading of the table: each listed rate is the lower limit of its rating (the top row says
 * "≥ 100 per thousand"), so a rate on a boundary takes the higher rating. The table leaves
 * 0.001–0.01 per thousand unassigned; that gap is rated 3, because rating 2 is given only below
 * 0.001 per thousand. Rating 1 is never returned: the handbook keeps it for causes a prevention
 * control makes physically impossible, which no capability index can show.
 *
 * @reference AIAG & VDA (2019). "FMEA Handbook", 1st Edition, Alternative PFMEA Occurrence (O)
 *   table — incidents per 1,000 items/vehicles.
 * @reference Montgomery, D. C. (2019). "Introduction to Statistical Quality Control", 8th Edition,
 *   §8.3 — process fallout of a normal process from its capability ratio.
 *
 * A negative Cpk is a measured result — the mean lies beyond a specification limit — and rates 10
 * like any Cpk under the top row's limit; its `ppm` is capped at 1,000,000 (every part
 * nonconforming), where the formula would pass 1.
 *
 * @throws {RangeError} Cpk must be a finite number
 */
export function cpkToOccurrence(input: CpkToOccurrenceInput): CpkToOccurrenceResult {
  requireFinite('cpkToOccurrence', input);
  const { cpk } = input;

  if (!Number.isFinite(cpk)) {
    throw inputRangeError('Cpk must be a finite number', {
      code: 'parameter_out_of_range', parameter: 'cpk', got: cpk,
    });
  }

  const row = RATINGS.find(r => cpk <= r.maxCpk)!;

  return {
    occurrence: row.occurrence,
    description: row.description,
    cpkRange: row.cpkRange,
    ppm: roundTo(Math.min(2 * normalCDF(-3 * cpk), 1) * 1e6, 4),
  };
}

/** Cpk at which a normal process is expected to produce `perThousand` nonconforming items. */
function cpkAtRate(perThousand: number): number {
  return -normalInvCDF(perThousand / 1000 / 2) / 3;
}

/**
 * The alternative PFMEA occurrence table, highest rating first. `rate` is the incidents per 1,000
 * that start the rating; rating 3 starts at 0.001 (the table's gap, see above).
 */
const TABLE: { occurrence: number; rate: number; description: string }[] = [
  { occurrence: 10, rate: 100,   description: 'Extremely high' },
  { occurrence: 9,  rate: 50,    description: 'Very high' },
  { occurrence: 8,  rate: 20,    description: 'Very high' },
  { occurrence: 7,  rate: 10,    description: 'High' },
  { occurrence: 6,  rate: 2,     description: 'High' },
  { occurrence: 5,  rate: 0.5,   description: 'Moderate' },
  { occurrence: 4,  rate: 0.1,   description: 'Moderate' },
  { occurrence: 3,  rate: 0.001, description: 'Low' },
];

const fmt = (x: number) => x.toFixed(2);

const RATINGS: { occurrence: number; maxCpk: number; description: string; cpkRange: string }[] = [
  ...TABLE.map((r, i) => {
    const maxCpk = cpkAtRate(r.rate);
    const cpkRange = i === 0 ? `<= ${fmt(maxCpk)}` : `${fmt(cpkAtRate(TABLE[i - 1].rate))} - ${fmt(maxCpk)}`;
    return { occurrence: r.occurrence, maxCpk, description: r.description, cpkRange };
  }),
  {
    occurrence: 2,
    maxCpk: Infinity,
    description: 'Very low',
    cpkRange: `> ${fmt(cpkAtRate(TABLE[TABLE.length - 1].rate))}`,
  },
];
