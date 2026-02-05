import { roundTo } from '../utils.js';
import type { SafetyStockInput, SafetyStockResult } from './types.js';

/**
 * Approximate inverse of the standard normal CDF (quantile function)
 * Using Abramowitz & Stegun 26.2.23 rational approximation
 *
 * @param p - Probability (0 < p < 1)
 * @returns z-score (standard normal quantile)
 */
function normSInv(p: number): number {
  // Coefficients for the rational approximation
  const a1 = -3.969683028665376e+01;
  const a2 =  2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 =  1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 =  2.506628277459239e+00;

  const b1 = -5.447609879822406e+01;
  const b2 =  1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 =  6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;

  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 =  4.374664141464968e+00;
  const c6 =  2.938163982698783e+00;

  const d1 =  7.784695709041462e-03;
  const d2 =  3.224671290700398e-01;
  const d3 =  2.445134137142996e+00;
  const d4 =  3.754408661907416e+00;

  // Define break-points
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    // Rational approximation for lower region
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
           ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= pHigh) {
    // Rational approximation for central region
    q = p - 0.5;
    r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
           (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    // Rational approximation for upper region
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
}

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
  const zScore = normSInv(serviceLevel);

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
