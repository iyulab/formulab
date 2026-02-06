import { roundTo } from '../utils.js';
import { normalCDF } from '../math.js';
import type {
  FillRateInput,
  FillRateResult,
  ServiceLevelInput,
  ServiceLevelResult
} from './types.js';

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
  const { totalOrders, filledComplete } = input;

  // Handle zero/invalid inputs
  if (totalOrders <= 0) {
    return {
      fillRate: 0,
      shortfallRate: 100,
      filledComplete: 0,
      shortfall: 0,
    };
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
 */
export function serviceLevel(input: ServiceLevelInput): ServiceLevelResult {
  const { demandStdDev, safetyStock } = input;

  // Handle zero/invalid inputs
  if (demandStdDev <= 0) {
    return {
      zScore: 0,
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
