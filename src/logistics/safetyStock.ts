import { roundTo, requireFinite } from '../utils.js';
import { normalInvCDF } from '../math.js';
import type { SafetyStockInput, SafetyStockResult } from './types.js';
import { inputRangeError } from '../errors.js';

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
 * @throws RangeError if serviceLevel is not strictly between 0 and 1, or avgLeadTime, avgDemand,
 *   demandStdDev or leadTimeStdDev is negative
 */
export function safetyStock(input: SafetyStockInput): SafetyStockResult {
  requireFinite('safetyStock', input);
  const { avgDemand, demandStdDev, avgLeadTime, leadTimeStdDev, serviceLevel } = input;

  // The z-score is the inverse normal CDF of the service level, which diverges at both
  // ends: a level of 0 or 1 has no finite z and the whole result follows it to infinity.
  if (!(serviceLevel > 0) || serviceLevel >= 1) {
    throw inputRangeError('serviceLevel must be greater than 0 and less than 1', {
      code: 'parameter_out_of_range', parameter: 'serviceLevel', exclusive_min: 0, exclusive_max: 1, got: serviceLevel,
    });
  }

  // Calculate z-score for the desired service level
  // Lead-time demand variance scales with the lead time and is square-rooted.
  if (!(avgLeadTime >= 0)) {
    throw inputRangeError('avgLeadTime must not be negative', {
      code: 'parameter_out_of_range', parameter: 'avgLeadTime', min: 0, got: avgLeadTime,
    });
  }
  // A negative demand flips the sign of the lead-time demand and the reorder point; a standard
  // deviation cannot be negative (it is squared, so the sign would be silently dropped).
  if (!(avgDemand >= 0)) {
    throw inputRangeError('avgDemand must not be negative', {
      code: 'parameter_out_of_range', parameter: 'avgDemand', min: 0, got: avgDemand,
    });
  }
  if (!(demandStdDev >= 0)) {
    throw inputRangeError('demandStdDev must not be negative', {
      code: 'parameter_out_of_range', parameter: 'demandStdDev', min: 0, got: demandStdDev,
    });
  }
  if (!(leadTimeStdDev >= 0)) {
    throw inputRangeError('leadTimeStdDev must not be negative', {
      code: 'parameter_out_of_range', parameter: 'leadTimeStdDev', min: 0, got: leadTimeStdDev,
    });
  }

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
