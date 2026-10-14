import { roundTo } from '../utils.js';
import type { SelfDischargeInput, SelfDischargeResult } from './types.js';

/**
 * Calculate battery self-discharge rate
 *
 * @formula monthlyRate% = (ΔV / days) × 30 / Vnominal × 100
 * @param input - Initial voltage, final voltage, elapsed days, nominal voltage
 * @returns Daily and monthly self-discharge rates
 * @throws {RangeError} initialVoltage, finalVoltage, days or nominalVoltage is not greater than 0
 */
export function selfDischarge(input: SelfDischargeInput): SelfDischargeResult {
  const { initialVoltage, finalVoltage, days, nominalVoltage } = input;

  // A negative voltage reading is not a resting cell and flips the sign of the drop.
  if (!(initialVoltage > 0)) {
    throw new RangeError('initialVoltage must be greater than 0');
  }
  if (!(finalVoltage > 0)) {
    throw new RangeError('finalVoltage must be greater than 0');
  }
  if (!(days > 0)) {
    throw new RangeError('days must be greater than 0');
  }
  if (!(nominalVoltage > 0)) {
    throw new RangeError('nominalVoltage must be greater than 0');
  }

  // Self-discharge only lowers the resting voltage; a higher final reading is a measurement taken
  // before the cell settled (or after a charge), and would report a negative discharge rate.
  if (finalVoltage > initialVoltage) {
    throw new RangeError('finalVoltage must not exceed initialVoltage');
  }
  const totalVoltageDrop = initialVoltage - finalVoltage;
  const voltageDropPerDay = roundTo(totalVoltageDrop / days, 6);
  const dailyRatePercent = roundTo((voltageDropPerDay / nominalVoltage) * 100, 4);
  const monthlyRatePercent = roundTo(dailyRatePercent * 30, 2);

  return { voltageDropPerDay, monthlyRatePercent, dailyRatePercent };
}
