import { roundTo } from '../utils.js';
import type { BilinearInterpolationInput, BilinearInterpolationResult } from './types.js';

/**
 * Bilinear interpolation on a 2D grid z[xIndex][yIndex].
 *
 * @param input - Grid axes (x, y), values (z), and target point
 * @returns Interpolated value and extrapolation flag
 * @throws RangeError if x or y has fewer than 2 points, if z row count does not match x length,
 *   or if any z row length does not match y length
 */
export function bilinearInterpolation(input: BilinearInterpolationInput): BilinearInterpolationResult {
  const { x, y, z, targetX, targetY } = input;
  if (!x || x.length < 2) {
    throw new RangeError(`x must contain at least 2 points, got ${x?.length ?? 0}`);
  }
  if (!y || y.length < 2) {
    throw new RangeError(`y must contain at least 2 points, got ${y?.length ?? 0}`);
  }
  if (!z || z.length !== x.length) {
    throw new RangeError(`z must have ${x.length} rows to match x, got ${z?.length ?? 0}`);
  }
  for (const row of z) {
    if (row.length !== y.length) {
      throw new RangeError(`each z row must have ${y.length} columns to match y, got ${row.length}`);
    }
  }

  const xi = findBracket(x, targetX);
  const yi = findBracket(y, targetY);

  const isExtrapolation =
    targetX < x[0] || targetX > x[x.length - 1] ||
    targetY < y[0] || targetY > y[y.length - 1];

  const x0 = x[xi.lower];
  const x1 = x[xi.upper];
  const y0 = y[yi.lower];
  const y1 = y[yi.upper];

  const tx = x1 === x0 ? 0 : (targetX - x0) / (x1 - x0);
  const ty = y1 === y0 ? 0 : (targetY - y0) / (y1 - y0);

  const q00 = z[xi.lower][yi.lower];
  const q01 = z[xi.lower][yi.upper];
  const q10 = z[xi.upper][yi.lower];
  const q11 = z[xi.upper][yi.upper];

  const value =
    q00 * (1 - tx) * (1 - ty) +
    q10 * tx * (1 - ty) +
    q01 * (1 - tx) * ty +
    q11 * tx * ty;

  return {
    value: roundTo(value, 6),
    isExtrapolation,
  };
}

function findBracket(arr: number[], target: number): { lower: number; upper: number } {
  if (target <= arr[0]) return { lower: 0, upper: 1 };
  if (target >= arr[arr.length - 1]) return { lower: arr.length - 2, upper: arr.length - 1 };

  for (let i = 0; i < arr.length - 1; i++) {
    if (target >= arr[i] && target <= arr[i + 1]) {
      return { lower: i, upper: i + 1 };
    }
  }
  return { lower: arr.length - 2, upper: arr.length - 1 };
}
