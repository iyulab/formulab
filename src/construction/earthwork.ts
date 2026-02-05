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
 */
export function earthwork(input: EarthworkInput): EarthworkResult {
  const { length, width, depth, swellFactor, shrinkFactor } = input;

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
