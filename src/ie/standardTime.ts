import { roundTo, requireFinite } from '../utils.js';
import type { StandardTimeInput, StandardTimeResult } from './types.js';
import { inputRangeError } from '../errors.js';

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
  requireFinite('standardTime', input);
  const { observedTime, ratingFactor, allowancePercent } = input;

  if (!Number.isFinite(observedTime) || observedTime <= 0) {
    throw inputRangeError('Observed time must be a positive number', {
      code: 'parameter_out_of_range', parameter: 'observedTime', exclusive_min: 0, got: observedTime,
    });
  }
  if (!Number.isFinite(ratingFactor) || ratingFactor <= 0 || ratingFactor > 2) {
    throw inputRangeError('Rating factor must be between 0 (exclusive) and 2 (inclusive)', {
      code: 'parameter_out_of_range', parameter: 'ratingFactor', exclusive_min: 0, max: 2, got: ratingFactor,
    });
  }
  if (!Number.isFinite(allowancePercent) || allowancePercent < 0 || allowancePercent > 100) {
    throw inputRangeError('Allowance percent must be between 0 and 100', {
      code: 'parameter_out_of_range', parameter: 'allowancePercent', min: 0, max: 100, got: allowancePercent,
    });
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
