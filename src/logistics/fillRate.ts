import { roundTo, requireFinite } from '../utils.js';
import { normalCDF } from '../math.js';
import type {
  FillRateInput,
  FillRateResult,
  ServiceLevelInput,
  ServiceLevelResult
} from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate Fill Rate
 *
 * Fill rate measures the percentage of orders or order lines that are
 * fulfilled completely from available stock.
 *
 * @param input - Fill rate calculation inputs
 * @returns Fill rate results
 */
export function fillRate(input: FillRateInput): FillRateResult {
  requireFinite('fillRate', input);
  const { totalOrders, filledComplete } = input;

  if (totalOrders <= 0) {
    throw inputRangeError('totalOrders must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'totalOrders', exclusive_min: 0, got: totalOrders,
    });
  }

  // Clamp filledComplete to valid range
  const actualFilled = Math.min(Math.max(0, filledComplete), totalOrders);
  const shortfall = totalOrders - actualFilled;

  // Calculate fill rate
  const rate = (actualFilled / totalOrders) * 100;
  const shortfallRate = 100 - rate;

  return {
    fillRate: roundTo(rate, 2),
    shortfallRate: roundTo(shortfallRate, 2),
    filledComplete: actualFilled,
    shortfall,
  };
}

/**
 * Calculate Service Level from Safety Stock
 *
 * Determines the service level achieved given current safety stock and
 * demand variability.
 *
 * @param input - Service level calculation inputs
 * @returns Service level results
 * @throws {RangeError} safetyStock or demandStdDev is negative
 */
export function serviceLevel(input: ServiceLevelInput): ServiceLevelResult {
  requireFinite('serviceLevel', input);
  const { demandStdDev, safetyStock } = input;

  // A negative safety stock is a shortfall, not a buffer, and a standard deviation cannot be
  // negative; either one flips the sign of the z-score.
  if (!(safetyStock >= 0)) {
    throw inputRangeError('safetyStock must not be negative', {
      code: 'parameter_out_of_range', parameter: 'safetyStock', min: 0, got: safetyStock,
    });
  }
  if (!(demandStdDev >= 0)) {
    throw inputRangeError('demandStdDev must not be negative', {
      code: 'parameter_out_of_range', parameter: 'demandStdDev', min: 0, got: demandStdDev,
    });
  }

  // Deterministic demand: any buffer covers it, none leaves the mean-demand coin flip — the
  // σ → 0 limits of Φ(SS/σ). The z-score itself has no finite value with a buffer (it grows
  // without bound), and is 0 without one.
  if (demandStdDev === 0) {
    return {
      zScore: safetyStock > 0 ? null : 0,
      serviceLevel: safetyStock > 0 ? 100 : 50,
      stockoutProbability: safetyStock > 0 ? 0 : 50,
    };
  }

  // Calculate z-score: z = safety stock / std dev
  const zScore = safetyStock / demandStdDev;

  // Service level is the CDF of the normal distribution at z
  // This gives the probability of demand being less than or equal to
  // (average demand + safety stock)
  const level = normalCDF(zScore) * 100;
  const stockoutProbability = 100 - level;

  return {
    zScore: roundTo(zScore, 3),
    serviceLevel: roundTo(level, 2),
    stockoutProbability: roundTo(stockoutProbability, 2),
  };
}
