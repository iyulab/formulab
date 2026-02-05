import type { PpmInput, PpmResult } from './types.js';

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Standard normal CDF approximation using Abramowitz and Stegun
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Approximation of the inverse normal CDF (probit function)
 * Uses Abramowitz and Stegun approximation
 */
function normalInvCDF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  // Use rational approximation
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.383577518672690e2,
    -3.066479806614716e1,
    2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838e0,
    -2.549732539343734e0,
    4.374664141464968e0,
    2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}

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
