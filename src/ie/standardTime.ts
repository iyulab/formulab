import { roundTo } from '../utils.js';
import type { StandardTimeInput, StandardTimeResult } from './types.js';

/**
 * Standard Time Calculation
 *
 * @formula
 *   normalTime = observedTime × ratingFactor
 *   standardTime = normalTime × (1 + allowancePercent / 100)
 *
 * @reference ILO (International Labour Organization). "Introduction to Work Study".
 * @reference Barnes, R.M. (1980). "Motion and Time Study: Design and Measurement of Work".
 *
 * @throws {RangeError} Observed time must be a positive number
 * @throws {RangeError} Rating factor must be between 0 (exclusive) and 2 (inclusive)
 * @throws {RangeError} Allowance percent must be between 0 and 100
 */
export function standardTime(input: StandardTimeInput): StandardTimeResult {
  const { observedTime, ratingFactor, allowancePercent } = input;

  if (!Number.isFinite(observedTime) || observedTime <= 0) {
    throw new RangeError('Observed time must be a positive number');
  }
  if (!Number.isFinite(ratingFactor) || ratingFactor <= 0 || ratingFactor > 2) {
    throw new RangeError('Rating factor must be between 0 (exclusive) and 2 (inclusive)');
  }
  if (!Number.isFinite(allowancePercent) || allowancePercent < 0 || allowancePercent > 100) {
    throw new RangeError('Allowance percent must be between 0 and 100');
  }

  const normalTime = observedTime * ratingFactor;
  const allowanceTime = normalTime * (allowancePercent / 100);
  const std = normalTime + allowanceTime;

  return {
    normalTime: roundTo(normalTime, 4),
    standardTime: roundTo(std, 4),
    allowanceTime: roundTo(allowanceTime, 4),
  };
}
