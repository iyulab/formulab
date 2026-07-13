import { roundTo } from '../utils.js';
import type { RoughnessInput, RoughnessResult } from './types.js';

const ISO_1302_TABLE = [
  { n: 1, ra: 0.025, rz: 0.1 },
  { n: 2, ra: 0.05, rz: 0.2 },
  { n: 3, ra: 0.1, rz: 0.4 },
  { n: 4, ra: 0.2, rz: 0.8 },
  { n: 5, ra: 0.4, rz: 1.6 },
  { n: 6, ra: 0.8, rz: 3.2 },
  { n: 7, ra: 1.6, rz: 6.3 },
  { n: 8, ra: 3.2, rz: 12.5 },
  { n: 9, ra: 6.3, rz: 25 },
  { n: 10, ra: 12.5, rz: 50 },
  { n: 11, ra: 25, rz: 100 },
  { n: 12, ra: 50, rz: 200 },
];

function findClosest(key: 'ra' | 'rz', value: number) {
  let closest = ISO_1302_TABLE[0];
  let minDiff = Math.abs(value - closest[key]);
  for (const entry of ISO_1302_TABLE) {
    const diff = Math.abs(value - entry[key]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  return closest;
}

/**
 * Convert surface roughness between Ra, Rz, and N class.
 *
 * Conversion is a lookup against the ISO 1302 grade table (N1-N12, Ra 0.025-50 µm,
 * Rz 0.1-200 µm) with nearest-grade snapping. Inputs outside the table — realistic ones exist
 * on both ends (lapped/superfinished Ra ≈ 0.006 µm, rough sand casting Ra ≈ 100 µm) — are
 * snapped to the boundary grade and disclosed via `outOfTableRange: true`, because the
 * returned grade is then NOT equivalent to the input (up to 4× off at the edges).
 *
 * @reference ISO 1302 — surface texture indication, N-grade table
 * @throws RangeError if value is not positive
 */
export function roughness(input: RoughnessInput): RoughnessResult {
  const { fromScale, value } = input;

  if (value <= 0) {
    throw new RangeError('value must be greater than 0');
  }

  const first = ISO_1302_TABLE[0];
  const last = ISO_1302_TABLE[ISO_1302_TABLE.length - 1];
  let entry;
  let outOfTableRange = false;

  if (fromScale === 'N') {
    const n = roundTo(value, 0);
    entry = ISO_1302_TABLE.find(e => e.n === n);
    if (!entry) {
      // outside N1-N12 — snap to the boundary grade and disclose
      outOfTableRange = true;
      const clamped = Math.max(1, Math.min(12, n));
      entry = ISO_1302_TABLE.find(e => e.n === clamped)!;
    }
  } else if (fromScale === 'Ra') {
    entry = findClosest('ra', value);
    outOfTableRange = value < first.ra || value > last.ra;
  } else {
    entry = findClosest('rz', value);
    outOfTableRange = value < first.rz || value > last.rz;
  }

  return {
    ra: roundTo(entry.ra, 3),
    rz: roundTo(entry.rz, 1),
    nClass: entry.n,
    rms: roundTo(entry.ra * 1.11, 3),
    outOfTableRange,
  };
}
