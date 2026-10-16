import type { NoiseExposureInput, NoiseExposureResult } from './types.js';
import { requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate allowable exposure time for a given sound level (OSHA formula)
 * Tn = 8 / 2^((L-90)/5)
 *
 * @param soundLevel - Sound level in dB(A)
 * @returns Allowable exposure time in hours
 */
function getAllowableTime(soundLevel: number): number {
  // OSHA uses 90 dB as the reference with 5 dB exchange rate
  // For levels below 80 dB, exposure is essentially unlimited
  if (soundLevel < 80) {
    return Infinity;
  }
  return 8 / Math.pow(2, (soundLevel - 90) / 5);
}

/**
 * Calculate noise exposure dose and TWA based on OSHA standards
 *
 * Dose = Sum(Cn/Tn) x 100
 * TWA = 16.61 x log10(D/100) + 90
 *
 * Where:
 * - Cn = actual exposure duration at a given noise level
 * - Tn = allowable exposure duration at that level
 * - D = dose percentage
 *
 * Status thresholds:
 * - compliant: dose <= 50% (action level)
 * - actionRequired: 50% < dose <= 100% (PEL)
 * - exceeds: dose > 100%
 *
 * @param input - Noise exposure input with array of exposures
 * @returns Noise exposure result with dose, TWA, and status
 * @throws {RangeError} an exposure entry has a negative duration.
 * @remarks An empty exposure list (no significant noise) is a valid input that
 *   reports a compliant 0% dose.
 */
export function noiseExposure(input: NoiseExposureInput): NoiseExposureResult {
  requireFinite('noiseExposure', input);
  const { exposures } = input;

  for (const [i, exposure] of exposures.entries()) {
    if (exposure.duration < 0) {
      throw inputRangeError('exposure duration must not be negative', {
        code: 'parameter_out_of_range', parameter: `exposures[${i}].duration`, min: 0, got: exposure.duration,
      });
    }
  }

  // Each exposure's share Cn/Tn; the dose is their sum. Exposures below 80 dB have
  // no finite allowable time and contribute nothing.
  const contributions = exposures.map(({ soundLevel, duration }) => {
    const allowableTime = getAllowableTime(soundLevel);
    const counted = allowableTime !== Infinity;
    return {
      soundLevel,
      duration,
      allowableTime: counted ? allowableTime : null,
      dosePercent: counted ? (duration / allowableTime) * 100 : 0,
    };
  });

  // Dose as percentage
  const dose = contributions.reduce((sum, c) => sum + c.dosePercent, 0);

  // Calculate TWA (8-hour Time Weighted Average)
  // TWA = 16.61 x log10(D/100) + 90
  // If dose is 0, TWA is undefined (use a low value)
  let twa: number;
  if (dose > 0) {
    twa = 16.61 * Math.log10(dose / 100) + 90;
  } else {
    // No significant noise exposure
    twa = 0;
  }

  // Determine status
  let status: 'compliant' | 'actionRequired' | 'exceeds';
  if (dose <= 50) {
    status = 'compliant';
  } else if (dose <= 100) {
    status = 'actionRequired';
  } else {
    status = 'exceeds';
  }

  return {
    dose,
    contributions,
    twa,
    status,
  };
}
