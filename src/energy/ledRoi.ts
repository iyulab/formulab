import { roundTo } from '../utils.js';
import type { LedRoiInput, LedRoiResult } from './types.js';

/**
 * Calculate LED lighting retrofit ROI.
 *
 * energySaved = fixtureCount × (oldWatts − newWatts) × hours / 1000
 * costSaved = energySaved × rate
 * payback = totalInvestment / costSaved
 * co2Saved = energySaved × co2Factor
 *
 * @param input - LED retrofit parameters
 * @returns LED ROI result with energy savings, cost savings, and payback
 */
export function ledRoi(input: LedRoiInput): LedRoiResult {
  const {
    fixtureCount,
    oldWatts,
    newWatts,
    operatingHours,
    electricityRate,
    fixtureCost = 0,
    installationCost = 0,
    co2Factor = 0.5,
  } = input;

  if (fixtureCount <= 0 || operatingHours <= 0) {
    return {
      oldAnnualEnergy: 0,
      newAnnualEnergy: 0,
      annualEnergySaved: 0,
      energyReduction: 0,
      annualCostSaved: 0,
      totalInvestment: 0,
      paybackPeriod: null,
      co2Saved: 0,
    };
  }

  const oldAnnualEnergy = (fixtureCount * oldWatts * operatingHours) / 1000;
  const newAnnualEnergy = (fixtureCount * newWatts * operatingHours) / 1000;
  const annualEnergySaved = oldAnnualEnergy - newAnnualEnergy;
  const energyReduction = oldAnnualEnergy > 0 ? (annualEnergySaved / oldAnnualEnergy) * 100 : 0;
  const annualCostSaved = annualEnergySaved * electricityRate;

  const totalInvestment = (fixtureCost * fixtureCount) + installationCost;

  let paybackPeriod: number | null = null;
  if (totalInvestment > 0 && annualCostSaved > 0) {
    paybackPeriod = totalInvestment / annualCostSaved;
  }

  const co2Saved = annualEnergySaved * co2Factor;

  return {
    oldAnnualEnergy: roundTo(oldAnnualEnergy, 4),
    newAnnualEnergy: roundTo(newAnnualEnergy, 4),
    annualEnergySaved: roundTo(annualEnergySaved, 4),
    energyReduction: roundTo(energyReduction, 4),
    annualCostSaved: roundTo(annualCostSaved, 2),
    totalInvestment: roundTo(totalInvestment, 2),
    paybackPeriod: paybackPeriod !== null ? roundTo(paybackPeriod, 4) : null,
    co2Saved: roundTo(co2Saved, 4),
  };
}
