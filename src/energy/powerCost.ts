import { roundTo } from '../utils.js';
import type { PowerCostInput, PowerCostResult } from './types.js';

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
 */
export function powerCost(input: PowerCostInput): PowerCostResult {
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
