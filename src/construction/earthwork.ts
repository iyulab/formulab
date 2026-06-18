import type { EarthworkInput, EarthworkResult } from './types.js';

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
  const { length, width, depth, swellFactor, shrinkFactor } = input;

  if (length <= 0) {
    throw new RangeError('length must be greater than 0');
  }
  if (width <= 0) {
    throw new RangeError('width must be greater than 0');
  }
  if (depth <= 0) {
    throw new RangeError('depth must be greater than 0');
  }
  if (swellFactor <= 0) {
    throw new RangeError('swellFactor must be greater than 0');
  }
  if (shrinkFactor <= 0) {
    throw new RangeError('shrinkFactor must be greater than 0');
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
