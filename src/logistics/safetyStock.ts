import { roundTo } from '../utils.js';
import { normalInvCDF } from '../math.js';
import type { SafetyStockInput, SafetyStockResult } from './types.js';

/**
 * Calculate Safety Stock and Reorder Point
 *
 * Safety Stock provides a buffer against variability in demand and lead time.
 *
 * Formula:
 *   σ_DDLT = sqrt(L × σ_d² + d² × σ_L²)
 *   Safety Stock = z × σ_DDLT
 *   ROP = (d × L) + Safety Stock
 *
 * Where:
 *   d = average daily demand
 *   σ_d = standard deviation of daily demand
 *   L = average lead time (days)
 *   σ_L = standard deviation of lead time
 *   z = z-score for desired service level
 *   σ_DDLT = standard deviation of demand during lead time
 *
 * @param input - Demand and lead time parameters with service level
 * @returns Safety stock, reorder point, and related metrics
 */
export function safetyStock(input: SafetyStockInput): SafetyStockResult {
  const { avgDemand, demandStdDev, avgLeadTime, leadTimeStdDev, serviceLevel } = input;

  // Calculate z-score for the desired service level
  const zScore = normalInvCDF(serviceLevel);

  // Average demand during lead time
  const demandDuringLeadTime = avgDemand * avgLeadTime;

  // Standard deviation of demand during lead time (DDLT)
  // σ_DDLT = sqrt(L × σ_d² + d² × σ_L²)
  const varianceDemand = avgLeadTime * (demandStdDev ** 2);
  const varianceLeadTime = (avgDemand ** 2) * (leadTimeStdDev ** 2);
  const stdDevDDLT = Math.sqrt(varianceDemand + varianceLeadTime);

  // Safety Stock = z × σ_DDLT
  const safetyStockValue = zScore * stdDevDDLT;

  // Reorder Point = Average DDLT + Safety Stock
  const reorderPoint = demandDuringLeadTime + safetyStockValue;

  return {
    zScore: roundTo(zScore, 6),
    safetyStock: roundTo(safetyStockValue, 0),
    reorderPoint: roundTo(reorderPoint, 0),
    demandDuringLeadTime: roundTo(demandDuringLeadTime, 0),
  };
}
