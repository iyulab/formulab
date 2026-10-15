import { roundTo, requireFinite } from '../utils.js';
import { normalInvCDF } from '../math.js';
import type { WorkSamplingInput, WorkSamplingResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Work Sampling Analysis
 *
 * @formula
 *   proportion = activityObservations / totalObservations
 *   requiredObservations = z² × p × (1 - p) / e²
 *   marginOfError = z × √(p × (1 - p) / totalObservations)
 *
 * @reference Barnes, R.M. (1980). "Motion and Time Study".
 * @reference ILO. "Introduction to Work Study".
 *
 * @throws {RangeError} Total observations must be a positive integer
 * @throws {RangeError} Activity observations must be between 0 and total observations
 * @throws {RangeError} Confidence must be between 0 and 1 (exclusive)
 * @throws {RangeError} Accuracy must be a positive number
 */
export function workSampling(input: WorkSamplingInput): WorkSamplingResult {
  requireFinite('workSampling', input);
  const { totalObservations, activityObservations, confidence, accuracy } = input;

  if (!Number.isFinite(totalObservations) || totalObservations <= 0) {
    throw inputRangeError('Total observations must be a positive integer', {
      code: 'parameter_out_of_range', parameter: 'totalObservations', exclusive_min: 0, got: totalObservations,
    });
  }
  if (!Number.isFinite(activityObservations) || activityObservations < 0 || activityObservations > totalObservations) {
    throw inputRangeError('Activity observations must be between 0 and total observations', {
      code: 'parameter_out_of_range', parameter: 'activityObservations', min: 0, max: totalObservations, got: activityObservations,
    });
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

  const p = activityObservations / totalObservations;
  const z = normalInvCDF(1 - (1 - confidence) / 2);
  const e = accuracy / 100;

  const required = Math.ceil((z * z * p * (1 - p)) / (e * e));
  const marginOfError = z * Math.sqrt((p * (1 - p)) / totalObservations);

  return {
    proportion: roundTo(p, 4),
    requiredObservations: required,
    isSufficient: totalObservations >= required,
    marginOfError: roundTo(marginOfError, 4),
  };
}
