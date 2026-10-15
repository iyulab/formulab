import type { MotorEfficiencyInput, MotorEfficiencyResult } from './types.js';
import { requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';

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
 * @throws {RangeError} currentEfficiency or newEfficiency is outside (0, 1]; loadFactor is outside
 *   [0, 1]; or motorPower, runningHours, electricityRate or upgradeCost is negative
 */
export function motorEfficiency(input: MotorEfficiencyInput): MotorEfficiencyResult {
  requireFinite('motorEfficiency', input);
  const {
    motorPower,
    runningHours,
    currentEfficiency,
    newEfficiency,
    electricityRate,
    loadFactor,
    upgradeCost,
  } = input;

  // The annual energy divides the shaft energy by each efficiency, and an efficiency is a
  // fraction; a negative power, duration, load share or price flips the sign of a cost.
  if (!(currentEfficiency > 0) || currentEfficiency > 1) {
    throw inputRangeError('currentEfficiency must be greater than 0 and at most 1', {
      code: 'parameter_out_of_range', parameter: 'currentEfficiency', exclusive_min: 0, max: 1, got: currentEfficiency,
    });
  }
  if (!(newEfficiency > 0) || newEfficiency > 1) {
    throw inputRangeError('newEfficiency must be greater than 0 and at most 1', {
      code: 'parameter_out_of_range', parameter: 'newEfficiency', exclusive_min: 0, max: 1, got: newEfficiency,
    });
  }
  if (!(loadFactor >= 0) || loadFactor > 1) {
    throw inputRangeError('loadFactor must be between 0 and 1', {
      code: 'parameter_out_of_range', parameter: 'loadFactor', min: 0, max: 1, got: loadFactor,
    });
  }
  if (!(motorPower >= 0)) {
    throw inputRangeError('motorPower must not be negative', {
      code: 'parameter_out_of_range', parameter: 'motorPower', min: 0, got: motorPower,
    });
  }
  if (!(runningHours >= 0)) {
    throw inputRangeError('runningHours must not be negative', {
      code: 'parameter_out_of_range', parameter: 'runningHours', min: 0, got: runningHours,
    });
  }
  if (!(electricityRate >= 0)) {
    throw inputRangeError('electricityRate must not be negative', {
      code: 'parameter_out_of_range', parameter: 'electricityRate', min: 0, got: electricityRate,
    });
  }
  if (upgradeCost !== undefined && !(upgradeCost >= 0)) {
    throw inputRangeError('upgradeCost must not be negative', {
      code: 'parameter_out_of_range', parameter: 'upgradeCost', min: 0, got: upgradeCost,
    });
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
