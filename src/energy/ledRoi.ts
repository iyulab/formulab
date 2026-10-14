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
 * @throws {RangeError} fixtureCount or operatingHours is not greater than 0, or oldWatts,
 *   newWatts, electricityRate, fixtureCost, installationCost or co2Factor is negative
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

  // A retrofit of no fixtures, or of fixtures that never run, has no saving to report; a negative
  // wattage, rate, cost or emission factor flips the sign of a saving.
  if (!(fixtureCount > 0)) {
    throw new RangeError('fixtureCount must be greater than 0');
  }
  if (!(operatingHours > 0)) {
    throw new RangeError('operatingHours must be greater than 0');
  }
  if (!(oldWatts >= 0)) {
    throw new RangeError('oldWatts must not be negative');
  }
  if (!(newWatts >= 0)) {
    throw new RangeError('newWatts must not be negative');
  }
  if (!(electricityRate >= 0)) {
    throw new RangeError('electricityRate must not be negative');
  }
  if (!(fixtureCost >= 0)) {
    throw new RangeError('fixtureCost must not be negative');
  }
  if (!(installationCost >= 0)) {
    throw new RangeError('installationCost must not be negative');
  }
  if (!(co2Factor >= 0)) {
    throw new RangeError('co2Factor must not be negative');
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
