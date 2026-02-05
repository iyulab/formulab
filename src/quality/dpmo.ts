import { roundTo } from '../utils.js';
import type { DpmoInput, DpmoResult } from './types.js';

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
 * Convert DPMO to Sigma level using normal distribution
 * Sigma = normalInvCDF(1 - DPMO/1000000) + 1.5 (with 1.5 sigma shift)
 */
function dpmoToSigma(dpmoValue: number): number {
  if (dpmoValue <= 0) return 6; // Perfect process
  if (dpmoValue >= 1000000) return 0; // No capability

  // Calculate Z-score from yield
  const yield_decimal = 1 - dpmoValue / 1000000;
  const zScore = normalInvCDF(yield_decimal);

  // Add 1.5 sigma shift (industry standard for long-term capability)
  return zScore + 1.5;
}

/**
 * Calculate Defects Per Million Opportunities (DPMO) and related metrics
 * DPMO = (Defects / (Units x Opportunities)) x 1,000,000
 *
 * @param input - DPMO input parameters
 * @returns DPMO analysis result
 */
export function dpmo(input: DpmoInput): DpmoResult {
  const { defects, units, opportunities } = input;

  // Handle invalid inputs
  if (units <= 0 || opportunities <= 0) {
    return { dpmo: 0, sigmaLevel: 0, yield: 0, dpu: 0, defectRate: 0 };
  }

  // Calculate total opportunities
  const totalOpportunities = units * opportunities;

  // Calculate DPMO
  const dpmoValue = (defects / totalOpportunities) * 1000000;

  // Calculate DPU (defects per unit)
  const dpu = defects / units;

  // Calculate defect rate percentage
  const defectRate = (defects / totalOpportunities) * 100;

  // Calculate yield percentage
  const yieldPercent = (1 - dpmoValue / 1000000) * 100;

  // Calculate sigma level
  const sigmaLevel = dpmoToSigma(dpmoValue);

  return {
    dpmo: roundTo(dpmoValue, 2),
    sigmaLevel: roundTo(sigmaLevel, 2),
    yield: roundTo(yieldPercent, 4),
    dpu: roundTo(dpu, 4),
    defectRate: roundTo(defectRate, 4),
  };
}
