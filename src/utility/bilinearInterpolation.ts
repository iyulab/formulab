import { roundTo } from '../utils.js';
import type { BilinearInterpolationInput, BilinearInterpolationResult } from './types.js';

export function bilinearInterpolation(input: BilinearInterpolationInput): BilinearInterpolationResult | null {
  const { x, y, z, targetX, targetY } = input;
  if (!x || !y || !z || x.length < 2 || y.length < 2) return null;
  if (z.length !== x.length) return null;
  for (const row of z) {
    if (row.length !== y.length) return null;
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
