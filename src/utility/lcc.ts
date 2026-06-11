import { roundTo } from '../utils.js';
import type { LccInput, LccResult } from './types.js';

/**
 * Calculate life cycle cost (LCC) with present-value discounting
 *
 * @param input - LCC input parameters
 * @returns LCC result with total cost, present values, and annual equivalent cost
 * @throws RangeError if initialCost is negative, lifespan is not positive,
 *   or discountRate is outside [0, 1)
 */
export function lcc(input: LccInput): LccResult {
  const { initialCost, annualOperatingCost, annualMaintenanceCost, disposalCost, lifespan, discountRate } = input;
  if (initialCost < 0) {
    throw new RangeError(`initialCost must be >= 0, got ${initialCost}`);
  }
  if (lifespan <= 0) {
    throw new RangeError(`lifespan must be > 0, got ${lifespan}`);
  }
  if (discountRate < 0 || discountRate >= 1) {
    throw new RangeError(`discountRate must be in [0, 1), got ${discountRate}`);
  }

  // Present value of annuity factor: (1 - (1+r)^-n) / r
  const pvFactor = discountRate === 0
    ? lifespan
    : (1 - (1 + discountRate) ** -lifespan) / discountRate;

  const presentValueOperating = annualOperatingCost * pvFactor;
  const presentValueMaintenance = annualMaintenanceCost * pvFactor;
  const presentValueDisposal = disposalCost / (1 + discountRate) ** lifespan;

  const totalLcc = initialCost + presentValueOperating + presentValueMaintenance + presentValueDisposal;

  // Annual equivalent cost
  const annualEquivalentCost = pvFactor === 0 ? totalLcc : totalLcc / pvFactor;

  return {
    totalLcc: roundTo(totalLcc, 6),
    presentValueOperating: roundTo(presentValueOperating, 6),
    presentValueMaintenance: roundTo(presentValueMaintenance, 6),
    presentValueDisposal: roundTo(presentValueDisposal, 6),
    annualEquivalentCost: roundTo(annualEquivalentCost, 6),
  };
}
