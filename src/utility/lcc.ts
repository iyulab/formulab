import { roundTo } from '../utils.js';
import type { LccInput, LccResult } from './types.js';

export function lcc(input: LccInput): LccResult | null {
  const { initialCost, annualOperatingCost, annualMaintenanceCost, disposalCost, lifespan, discountRate } = input;
  if (initialCost < 0 || lifespan <= 0) return null;
  if (discountRate < 0 || discountRate >= 1) return null;

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
