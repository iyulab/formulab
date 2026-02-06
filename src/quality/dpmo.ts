import { roundTo } from '../utils.js';
import { normalInvCDF } from '../math.js';
import type { DpmoInput, DpmoResult } from './types.js';

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
