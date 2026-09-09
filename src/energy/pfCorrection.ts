import type { PfCorrectionInput, PfCorrectionResult } from './types.js';

/**
 * Calculate power factor correction requirements and savings
 *
 * Formula: kVAR required = kW * (tan(arccos(PF_current)) - tan(arccos(PF_target)))
 *
 * Where:
 * - kVA = kW / PF (apparent power)
 * - tan(arccos(PF)) gives the reactive power factor
 *
 * @param input - Power factor correction input parameters
 * @returns Power factor correction result with kVAR, costs, and savings
 */
export function pfCorrection(input: PfCorrectionInput): PfCorrectionResult {
  const {
    kW,
    currentPf,
    targetPf,
    electricityRate,
    monthlyUsageHours,
    pfPenaltyRate,
    pfPenaltyThreshold,
    capacitorCostPerKvar,
  } = input;

  // Apparent power divides real power by the power factor; a factor at or below zero has
  // no apparent power to report, and one above 1 is not a power factor.
  if (!(currentPf > 0) || currentPf > 1) {
    throw new RangeError('currentPf must be greater than 0 and at most 1');
  }
  if (!(targetPf > 0) || targetPf > 1) {
    throw new RangeError('targetPf must be greater than 0 and at most 1');
  }

  // Calculate current and target apparent power (kVA)
  const currentKva = kW / currentPf;
  const targetKva = kW / targetPf;

  // Calculate required kVAR using the formula:
  // kVAR = kW * (tan(arccos(PF_current)) - tan(arccos(PF_target)))
  const currentAngle = Math.acos(currentPf);
  const targetAngle = Math.acos(targetPf);
  const kvarRequired = kW * (Math.tan(currentAngle) - Math.tan(targetAngle));

  // Calculate capacitor cost
  const capacitorCost = kvarRequired * capacitorCostPerKvar;

  // Calculate monthly energy consumption (kWh)
  const monthlyKwh = kW * monthlyUsageHours;

  // Calculate PF penalty
  // Penalty is typically applied when PF is below threshold
  // Penalty = (threshold - actual PF) / 0.01 * penalty rate * energy cost
  const calculatePenalty = (pf: number): number => {
    if (pf >= pfPenaltyThreshold) return 0;
    const penaltySteps = Math.floor((pfPenaltyThreshold - pf) * 100);
    return penaltySteps * pfPenaltyRate * monthlyKwh * electricityRate;
  };

  const currentMonthlyPenalty = calculatePenalty(currentPf);
  const newMonthlyPenalty = calculatePenalty(targetPf);

  // Monthly savings from avoided penalties
  const monthlySavings = currentMonthlyPenalty - newMonthlyPenalty;

  // Annual savings
  const annualSavings = monthlySavings * 12;

  // Payback period in months (return 0 if no savings)
  const paybackMonths = monthlySavings > 0 ? capacitorCost / monthlySavings : 0;

  return {
    currentKva,
    targetKva,
    kvarRequired,
    capacitorCost,
    currentMonthlyPenalty,
    newMonthlyPenalty,
    monthlySavings,
    annualSavings,
    paybackMonths,
  };
}
