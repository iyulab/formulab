import { roundTo, requireFinite } from '../utils.js';
import type { PowerCostInput, PowerCostResult } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate power cost including energy, demand, power factor penalty, and fixed charges
 *
 * Energy cost = energy consumption (kWh) * energy rate ($/kWh)
 * Demand cost = demand peak (kW) * demand rate ($/kW)
 * PF penalty = (threshold - actual PF) / 0.01 * penalty rate * (energy cost + demand cost)
 *              (only if actual PF < threshold)
 * Total cost = energy cost + demand cost + PF penalty + fixed charges
 *
 * @param input - Power cost input parameters
 * @returns Power cost result with breakdown of all costs
 * @throws {RangeError} powerFactor or pfPenaltyThreshold is outside [0, 1], or energyConsumption,
 *   energyRate, demandPeak, demandRate, pfPenaltyRate or fixedCharges is negative
 */
export function powerCost(input: PowerCostInput): PowerCostResult {
  requireFinite('powerCost', input);
  const {
    energyConsumption,
    energyRate,
    demandPeak,
    demandRate,
    powerFactor,
    pfPenaltyThreshold,
    pfPenaltyRate,
    fixedCharges,
  } = input;

  // A power factor is a fraction; a negative consumption, peak, rate or charge flips the sign
  // of a cost line.
  if (!(powerFactor >= 0) || powerFactor > 1) {
    throw new InputRangeError('powerFactor must be between 0 and 1', {
      code: 'parameter_out_of_range', parameter: 'powerFactor', min: 0, max: 1, got: powerFactor,
    });
  }
  if (!(pfPenaltyThreshold >= 0) || pfPenaltyThreshold > 1) {
    throw new InputRangeError('pfPenaltyThreshold must be between 0 and 1', {
      code: 'parameter_out_of_range', parameter: 'pfPenaltyThreshold', min: 0, max: 1, got: pfPenaltyThreshold,
    });
  }
  if (!(energyConsumption >= 0)) {
    throw new InputRangeError('energyConsumption must not be negative', {
      code: 'parameter_out_of_range', parameter: 'energyConsumption', min: 0, got: energyConsumption,
    });
  }
  if (!(energyRate >= 0)) {
    throw new InputRangeError('energyRate must not be negative', {
      code: 'parameter_out_of_range', parameter: 'energyRate', min: 0, got: energyRate,
    });
  }
  if (!(demandPeak >= 0)) {
    throw new InputRangeError('demandPeak must not be negative', {
      code: 'parameter_out_of_range', parameter: 'demandPeak', min: 0, got: demandPeak,
    });
  }
  if (!(demandRate >= 0)) {
    throw new InputRangeError('demandRate must not be negative', {
      code: 'parameter_out_of_range', parameter: 'demandRate', min: 0, got: demandRate,
    });
  }
  if (!(pfPenaltyRate >= 0)) {
    throw new InputRangeError('pfPenaltyRate must not be negative', {
      code: 'parameter_out_of_range', parameter: 'pfPenaltyRate', min: 0, got: pfPenaltyRate,
    });
  }
  if (!(fixedCharges >= 0)) {
    throw new InputRangeError('fixedCharges must not be negative', {
      code: 'parameter_out_of_range', parameter: 'fixedCharges', min: 0, got: fixedCharges,
    });
  }

  // Calculate energy cost
  const energyCost = energyConsumption * energyRate;

  // Calculate demand cost
  const demandCost = demandPeak * demandRate;

  // Calculate power factor penalty
  let pfPenalty = 0;
  if (powerFactor < pfPenaltyThreshold && pfPenaltyRate > 0) {
    // Number of 0.01 steps below threshold
    const stepsBelow = roundTo((pfPenaltyThreshold - powerFactor) / 0.01, 0);
    // Penalty is applied to energy + demand costs
    pfPenalty = stepsBelow * pfPenaltyRate * (energyCost + demandCost);
  }

  // Calculate total cost
  const totalCost = energyCost + demandCost + pfPenalty + fixedCharges;

  return {
    energyCost,
    demandCost,
    pfPenalty,
    fixedCharges,
    totalCost,
  };
}
