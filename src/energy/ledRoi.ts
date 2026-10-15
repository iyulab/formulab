import { roundTo, requireFinite } from '../utils.js';
import type { LedRoiInput, LedRoiResult } from './types.js';
import { inputRangeError } from '../errors.js';

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
 * @throws {RangeError} fixtureCount, operatingHours, oldWatts or newWatts is not greater than 0, or
 *   electricityRate, fixtureCost, installationCost or co2Factor is negative
 */
export function ledRoi(input: LedRoiInput): LedRoiResult {
  requireFinite('ledRoi', input);
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
    throw inputRangeError('fixtureCount must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'fixtureCount', exclusive_min: 0, got: fixtureCount,
    });
  }
  if (!(operatingHours > 0)) {
    throw inputRangeError('operatingHours must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'operatingHours', exclusive_min: 0, got: operatingHours,
    });
  }
  // A fixture drawing nothing has no energy to save: the reduction is undefined and every newWatts
  // reads as added use.
  if (!(oldWatts > 0)) {
    throw inputRangeError('oldWatts must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'oldWatts', exclusive_min: 0, got: oldWatts,
    });
  }
  // A replacement drawing nothing is not a light — it reads as a 100 % saving.
  if (!(newWatts > 0)) {
    throw inputRangeError('newWatts must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'newWatts', exclusive_min: 0, got: newWatts,
    });
  }
  if (!(electricityRate >= 0)) {
    throw inputRangeError('electricityRate must not be negative', {
      code: 'parameter_out_of_range', parameter: 'electricityRate', min: 0, got: electricityRate,
    });
  }
  if (!(fixtureCost >= 0)) {
    throw inputRangeError('fixtureCost must not be negative', {
      code: 'parameter_out_of_range', parameter: 'fixtureCost', min: 0, got: fixtureCost,
    });
  }
  if (!(installationCost >= 0)) {
    throw inputRangeError('installationCost must not be negative', {
      code: 'parameter_out_of_range', parameter: 'installationCost', min: 0, got: installationCost,
    });
  }
  if (!(co2Factor >= 0)) {
    throw inputRangeError('co2Factor must not be negative', {
      code: 'parameter_out_of_range', parameter: 'co2Factor', min: 0, got: co2Factor,
    });
  }

  const oldAnnualEnergy = (fixtureCount * oldWatts * operatingHours) / 1000;
  const newAnnualEnergy = (fixtureCount * newWatts * operatingHours) / 1000;
  const annualEnergySaved = oldAnnualEnergy - newAnnualEnergy;
  const energyReduction = (annualEnergySaved / oldAnnualEnergy) * 100;
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
