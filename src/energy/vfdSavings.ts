import type { VfdSavingsInput, VfdSavingsResult } from './types.js';

// Average CO2 emission factor (kg CO2 per kWh)
const CO2_FACTOR = 0.5;

/**
 * Calculate VFD (Variable Frequency Drive) energy savings
 *
 * Affinity Laws for centrifugal loads (pumps, fans):
 * - Flow is proportional to Speed
 * - Pressure is proportional to Speed squared
 * - Power is proportional to Speed cubed
 *
 * Formula: Savings = kW * hours * rate * (1 - (new_speed/full_speed)^3)
 *
 * @param input - VFD savings input parameters
 * @returns VFD savings result with power reduction, costs, and CO2 savings
 */
export function vfdSavings(input: VfdSavingsInput): VfdSavingsResult {
  const {
    motorKw,
    fullSpeedRpm,
    newSpeedRpm,
    runningHoursPerYear,
    electricityRate,
    loadFactor,
    vfdCost,
    vfdEfficiency,
  } = input;

  // Calculate speed ratio
  const speedRatio = newSpeedRpm / fullSpeedRpm;

  // Apply affinity law: Power is proportional to Speed cubed
  const powerRatio = Math.pow(speedRatio, 3);

  // Calculate original power consumption (accounting for load factor)
  const originalPowerKw = motorKw * loadFactor;

  // Calculate new power consumption with VFD
  // Account for VFD efficiency loss
  const newPowerKw = originalPowerKw * powerRatio / vfdEfficiency;

  // Power reduction
  const powerReduction = originalPowerKw - newPowerKw;
  const powerReductionPercent = (powerReduction / originalPowerKw) * 100;

  // Calculate annual energy consumption (kWh)
  const originalAnnualKwh = originalPowerKw * runningHoursPerYear;
  const newAnnualKwh = newPowerKw * runningHoursPerYear;

  // Calculate annual costs
  const originalAnnualCost = originalAnnualKwh * electricityRate;
  const newAnnualCost = newAnnualKwh * electricityRate;

  // Annual savings
  const annualSavings = originalAnnualCost - newAnnualCost;

  // Simple payback period (return 0 if no savings)
  const paybackYears = annualSavings > 0 ? vfdCost / annualSavings : 0;

  // CO2 reduction
  const annualKwhSavings = originalAnnualKwh - newAnnualKwh;
  const co2ReductionKg = annualKwhSavings * CO2_FACTOR;

  return {
    speedRatio,
    powerRatio,
    originalPowerKw,
    newPowerKw,
    powerReduction,
    powerReductionPercent,
    originalAnnualCost,
    newAnnualCost,
    annualSavings,
    paybackYears,
    co2ReductionKg,
  };
}
