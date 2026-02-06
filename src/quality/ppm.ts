import { roundTo } from '../utils.js';
import { normalCDF, normalInvCDF, clamp } from '../math.js';
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
 */
export function ppm(input: PpmInput): PpmResult {
  let defectRate: number;

  switch (input.convertFrom) {
    case 'defectRate':
      defectRate = clamp(input.value, 0, 100);
      break;
    case 'ppm':
      defectRate = clamp(input.value / 10000, 0, 100);
      break;
    case 'sigma':
      defectRate = sigmaToDefectRate(clamp(input.value, 0, 6));
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
