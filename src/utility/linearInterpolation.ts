import { roundTo } from '../utils.js';
import type { LinearInterpolationInput, LinearInterpolationResult } from './types.js';

/**
 * Linear interpolation (and extrapolation) over a tabulated x/y series
 *
 * @param input - x/y table and target x value
 * @returns Interpolated value with bracketing indices and extrapolation flag
 * @throws RangeError if x or y is missing, x and y lengths differ,
 *   or fewer than 2 points are provided
 */
export function linearInterpolation(input: LinearInterpolationInput): LinearInterpolationResult {
  const { x, y, target } = input;
  if (!x || !y) {
    throw new RangeError('x and y arrays are required');
  }
  if (x.length !== y.length) {
    throw new RangeError(`x and y must have the same length, got x.length=${x.length}, y.length=${y.length}`);
  }
  if (x.length < 2) {
    throw new RangeError(`x must contain at least 2 points, got ${x.length}`);
  }

  // Find bracketing interval
  let lowerIndex = 0;
  let upperIndex = x.length - 1;
  let isExtrapolation = false;

  if (target <= x[0]) {
    lowerIndex = 0;
    upperIndex = 1;
    isExtrapolation = target < x[0];
  } else if (target >= x[x.length - 1]) {
    lowerIndex = x.length - 2;
    upperIndex = x.length - 1;
    isExtrapolation = target > x[x.length - 1];
  } else {
    for (let i = 0; i < x.length - 1; i++) {
      if (target >= x[i] && target <= x[i + 1]) {
        lowerIndex = i;
        upperIndex = i + 1;
        break;
      }
    }
  }

  const x0 = x[lowerIndex];
  const x1 = x[upperIndex];
  const y0 = y[lowerIndex];
  const y1 = y[upperIndex];

  const t = x1 === x0 ? 0 : (target - x0) / (x1 - x0);
  const value = y0 + t * (y1 - y0);

  return {
    value: roundTo(value, 6),
    lowerIndex,
    upperIndex,
    isExtrapolation,
  };
}
