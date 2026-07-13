import { roundTo } from '../utils.js';
import { normalCDF, normalInvCDF } from '../math.js';
import type { PpmInput, PpmResult } from './types.js';

/**
 * Convert sigma level to defect rate (with 1.5 sigma shift)
 */
function sigmaToDefectRate(sigma: number): number {
  const yieldRate = normalCDF(sigma - 1.5);
  return (1 - yieldRate) * 100;
}

/**
 * Convert defect rate to sigma level (with 1.5 sigma shift)
 */
function defectRateToSigma(defectRate: number): number {
  const fraction = defectRate / 100;
  if (fraction <= 0) return 6;
  if (fraction >= 1) return 0;
  return normalInvCDF(1 - fraction) + 1.5;
}

/**
 * Convert between PPM, defect rate, and sigma level
 *
 * @param input - PPM conversion input
 * @returns PPM conversion result with all metrics
 * @throws {RangeError} defectRate outside [0, 100], ppm outside [0, 1,000,000], or
 *   sigma outside [0, 6] (this converter's supported short-term sigma domain with the
 *   conventional 1.5σ shift). Values were previously clamped silently, substituting a
 *   different quality level than requested.
 */
export function ppm(input: PpmInput): PpmResult {
  let defectRate: number;

  switch (input.convertFrom) {
    case 'defectRate':
      if (input.value < 0 || input.value > 100) {
        throw new RangeError('defectRate must be between 0 and 100');
      }
      defectRate = input.value;
      break;
    case 'ppm':
      if (input.value < 0 || input.value > 1_000_000) {
        throw new RangeError('ppm must be between 0 and 1,000,000');
      }
      defectRate = input.value / 10000;
      break;
    case 'sigma':
      if (input.value < 0 || input.value > 6) {
        throw new RangeError('sigma must be between 0 and 6');
      }
      defectRate = sigmaToDefectRate(input.value);
      break;
  }

  const ppmValue = defectRate * 10000;
  const dpmo = ppmValue; // For single opportunity, DPMO = PPM
  const sigma = defectRateToSigma(defectRate);
  const yieldRate = 100 - defectRate;

  return {
    defectRate: roundTo(defectRate, 4),
    ppm: roundTo(ppmValue, 2),
    dpmo: roundTo(dpmo, 2),
    sigma: roundTo(sigma, 2),
    yieldRate: roundTo(yieldRate, 4),
  };
}
