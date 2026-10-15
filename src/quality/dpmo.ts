import { roundTo, requireFinite } from '../utils.js';
import { normalInvCDF } from '../math.js';
import type { DpmoInput, DpmoResult } from './types.js';
import { InputRangeError } from '../errors.js';

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
 * @throws RangeError if defects is negative, units or opportunities is not positive, or defects
 *   exceeds units × opportunities (a yield below 0 %)
 */
export function dpmo(input: DpmoInput): DpmoResult {
  requireFinite('dpmo', input);
  const { defects, units, opportunities } = input;

  // Validate inputs
  if (!(defects >= 0)) {
    throw new InputRangeError('defects must not be negative', {
      code: 'parameter_out_of_range', parameter: 'defects', min: 0, got: defects,
    });
  }
  if (!(units > 0)) {
    throw new InputRangeError('units must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'units', exclusive_min: 0, got: units,
    });
  }
  if (!(opportunities > 0)) {
    throw new InputRangeError('opportunities must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'opportunities', exclusive_min: 0, got: opportunities,
    });
  }

  // Calculate total opportunities
  const totalOpportunities = units * opportunities;
  if (defects > totalOpportunities) {
    throw new InputRangeError('defects must not exceed units × opportunities', {
      code: 'parameter_out_of_range', parameter: 'defects', max: totalOpportunities, got: defects,
    });
  }

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
