import type { EarthworkInput, EarthworkResult } from './types.js';
import { requireFinite } from '../utils.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate earthwork volumes
 *
 * Bank Volume: Volume in natural/undisturbed state (in-situ)
 * Loose Volume: Volume after excavation (swelled)
 * Compacted Volume: Volume after compaction (shrunk)
 *
 * @param input - Earthwork dimensions and factors
 * @returns Volume calculations in m³
 * @throws RangeError if any dimension (length, width, depth) is not positive,
 *   or if swellFactor/shrinkFactor is not positive
 */
export function earthwork(input: EarthworkInput): EarthworkResult {
  requireFinite('earthwork', input);
  const { length, width, depth, swellFactor, shrinkFactor } = input;

  if (length <= 0) {
    throw new InputRangeError('length must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'length', exclusive_min: 0, got: length,
    });
  }
  if (width <= 0) {
    throw new InputRangeError('width must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'width', exclusive_min: 0, got: width,
    });
  }
  if (depth <= 0) {
    throw new InputRangeError('depth must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'depth', exclusive_min: 0, got: depth,
    });
  }
  if (swellFactor <= 0) {
    throw new InputRangeError('swellFactor must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'swellFactor', exclusive_min: 0, got: swellFactor,
    });
  }
  if (shrinkFactor <= 0) {
    throw new InputRangeError('shrinkFactor must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'shrinkFactor', exclusive_min: 0, got: shrinkFactor,
    });
  }

  // Bank volume = undisturbed volume
  const bankVolume = length * width * depth;

  // Loose volume = bank volume × swell factor
  const looseVolume = bankVolume * swellFactor;

  // Compacted volume = bank volume × shrink factor
  const compactedVolume = bankVolume * shrinkFactor;

  return {
    bankVolume,
    looseVolume,
    compactedVolume,
  };
}
