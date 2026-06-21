import type { MotorEfficiencyInput, MotorEfficiencyResult } from './types.js';

/**
 * Calculate motor efficiency upgrade economics
 *
 * Annual energy = motor power (kW) * running hours * load factor / efficiency
 * Annual cost = annual energy * electricity rate
 * Annual savings = current annual cost - new annual cost
 * Payback period = upgrade cost / annual savings
 *
 * @param input - Motor efficiency input parameters
 * @returns Motor efficiency result with costs, savings, and payback period
 */
export function motorEfficiency(input: MotorEfficiencyInput): MotorEfficiencyResult {
  const {
    motorPower,
    runningHours,
    currentEfficiency,
    newEfficiency,
    electricityRate,
    loadFactor,
    upgradeCost,
  } = input;

  // Handle edge case - invalid efficiency values
  if (currentEfficiency <= 0) {
    throw new RangeError('currentEfficiency must be greater than 0');
  }
  if (newEfficiency <= 0) {
    throw new RangeError('newEfficiency must be greater than 0');
  }

  // Calculate annual energy consumption for each efficiency level
  // Energy = Power * Hours * LoadFactor / Efficiency
  const currentAnnualEnergy = (motorPower * runningHours * loadFactor) / currentEfficiency;
  const newAnnualEnergy = (motorPower * runningHours * loadFactor) / newEfficiency;

  // Calculate annual costs
  const currentAnnualCost = currentAnnualEnergy * electricityRate;
  const newAnnualCost = newAnnualEnergy * electricityRate;

  // Calculate savings
  const annualSavings = currentAnnualCost - newAnnualCost;
  const energySavings = currentAnnualEnergy - newAnnualEnergy;

  // Calculate payback period
  let paybackPeriod: number | null = null;
  if (upgradeCost !== undefined && upgradeCost > 0 && annualSavings > 0) {
    paybackPeriod = upgradeCost / annualSavings;
  }

  return {
    currentAnnualCost,
    newAnnualCost,
    annualSavings,
    energySavings,
    paybackPeriod,
  };
}
