import { roundTo } from '../utils.js';
import type { SelfDischargeInput, SelfDischargeResult } from './types.js';

/**
 * Calculate battery self-discharge rate
 *
 * @formula monthlyRate% = (ΔV / days) × 30 / Vnominal × 100
 * @param input - Initial voltage, final voltage, elapsed days, nominal voltage
 * @returns Daily and monthly self-discharge rates
 */
export function selfDischarge(input: SelfDischargeInput): SelfDischargeResult {
  const { initialVoltage, finalVoltage, days, nominalVoltage } = input;

  const totalVoltageDrop = initialVoltage - finalVoltage;
  const voltageDropPerDay = roundTo(totalVoltageDrop / days, 6);
  const dailyRatePercent = roundTo((voltageDropPerDay / nominalVoltage) * 100, 4);
  const monthlyRatePercent = roundTo(dailyRatePercent * 30, 2);

  return { voltageDropPerDay, monthlyRatePercent, dailyRatePercent };
}
