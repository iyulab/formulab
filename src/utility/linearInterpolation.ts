import { roundTo } from '../utils.js';
import type { LinearInterpolationInput, LinearInterpolationResult } from './types.js';

export function linearInterpolation(input: LinearInterpolationInput): LinearInterpolationResult | null {
  const { x, y, target } = input;
  if (!x || !y || x.length !== y.length || x.length < 2) return null;

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
