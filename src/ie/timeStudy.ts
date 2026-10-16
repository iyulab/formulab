import { roundTo, requireFinite } from '../utils.js';
import { normalInvCDF } from '../math.js';
import type { TimeStudyInput, TimeStudyResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Time Study — Required Number of Observations
 *
 * @formula n = (z × s / (e × x̄))²
 *   where z = z-score for confidence level
 *         s = sample standard deviation
 *         e = accuracy / 100 (fractional)
 *         x̄ = sample mean
 *
 * @reference Barnes, R.M. (1980). "Motion and Time Study".
 * @reference Niebel, B.W. & Freivalds, A. (2003). "Methods, Standards, and Work Design".
 *
 * @throws {RangeError} Observations must have at least 2 elements
 * @throws {RangeError} All observation values must be positive
 * @throws {RangeError} Confidence must be between 0 and 1 (exclusive)
 * @throws {RangeError} Accuracy must be a positive number
 */
export function timeStudy(input: TimeStudyInput): TimeStudyResult {
  requireFinite('timeStudy', input);
  const { observations, confidence, accuracy } = input;

  if (!Array.isArray(observations) || observations.length < 2) {
    throw inputRangeError('Observations must have at least 2 elements', {
      code: 'insufficient_data', parameter: 'observations', min: 2,
      got: Array.isArray(observations) ? observations.length : 0,
    });
  }
  for (let i = 0; i < observations.length; i++) {
    if (!Number.isFinite(observations[i]) || observations[i] <= 0) {
      throw inputRangeError('All observation values must be positive', {
        code: 'parameter_out_of_range', parameter: 'observations[i]', exclusive_min: 0, got: observations[i],
      });
    }
  }
  if (!Number.isFinite(confidence) || confidence <= 0 || confidence >= 1) {
    throw inputRangeError('Confidence must be between 0 and 1 (exclusive)', {
      code: 'parameter_out_of_range', parameter: 'confidence', exclusive_min: 0, exclusive_max: 1, got: confidence,
    });
  }
  if (!Number.isFinite(accuracy) || accuracy <= 0) {
    throw inputRangeError('Accuracy must be a positive number', {
      code: 'parameter_out_of_range', parameter: 'accuracy', exclusive_min: 0, got: accuracy,
    });
  }

  const n = observations.length;
  const mean = observations.reduce((s, v) => s + v, 0) / n;
  const variance = observations.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  // z-score for two-tailed confidence
  const z = normalInvCDF(1 - (1 - confidence) / 2);
  const e = accuracy / 100;

  const required = Math.ceil((z * stdDev / (e * mean)) ** 2);

  return {
    mean: roundTo(mean, 4),
    stdDev: roundTo(stdDev, 4),
    count: n,
    requiredObservations: required,
    isSufficient: n >= required,
  };
}
