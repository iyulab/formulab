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
 */
export function roughness(input: RoughnessInput): RoughnessResult {
  const { fromScale, value } = input;

  if (value === 0) {
    return { ra: 0, rz: 0, nClass: 0, rms: 0 };
  }

  let entry;

  if (fromScale === 'N') {
    const n = Math.round(value);
    entry = ISO_1302_TABLE.find(e => e.n === n);
    if (!entry) {
      // clamp to valid range
      const clamped = Math.max(1, Math.min(12, n));
      entry = ISO_1302_TABLE.find(e => e.n === clamped)!;
    }
  } else if (fromScale === 'Ra') {
    entry = findClosest('ra', value);
  } else {
    entry = findClosest('rz', value);
  }

  return {
    ra: roundTo(entry.ra, 3),
    rz: roundTo(entry.rz, 1),
    nClass: entry.n,
    rms: roundTo(entry.ra * 1.11, 3),
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
