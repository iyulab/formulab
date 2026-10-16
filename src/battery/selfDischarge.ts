import { roundTo, requireFinite } from '../utils.js';
import type { SelfDischargeInput, SelfDischargeResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Battery self-discharge from two open-circuit voltage readings.
 *
 * The measured quantity is the OCV decay rate, ΔV / days — what a cell-line OCV screen (K-value)
 * compares against its acceptance limit. The percentages are that decay relative to the nominal
 * voltage; they are **not** capacity loss, so they cannot be compared with datasheet
 * self-discharge figures (% of capacity per month) without the chemistry's OCV–SOC curve.
 *
 * @formula ΔV/day = (Vinitial − Vfinal) / days; monthlyRate% = ΔV/day × 30 / Vnominal × 100
 * @param input - Initial voltage, final voltage, elapsed days, nominal voltage, optional acceptance limit (mV/day)
 * @returns Decay per day (V and mV), as % of nominal per day and per month, and — given a limit — whether it is within it
 * @throws {RangeError} initialVoltage, finalVoltage, days, nominalVoltage or limitMvPerDay is not greater than 0
 */
export function selfDischarge(input: SelfDischargeInput): SelfDischargeResult {
  requireFinite('selfDischarge', input);
  const { initialVoltage, finalVoltage, days, nominalVoltage, limitMvPerDay } = input;

  // A negative voltage reading is not a resting cell and flips the sign of the drop.
  if (!(initialVoltage > 0)) {
    throw inputRangeError('initialVoltage must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'initialVoltage', exclusive_min: 0, got: initialVoltage,
    });
  }
  if (!(finalVoltage > 0)) {
    throw inputRangeError('finalVoltage must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'finalVoltage', exclusive_min: 0, got: finalVoltage,
    });
  }
  if (!(days > 0)) {
    throw inputRangeError('days must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'days', exclusive_min: 0, got: days,
    });
  }
  if (!(nominalVoltage > 0)) {
    throw inputRangeError('nominalVoltage must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'nominalVoltage', exclusive_min: 0, got: nominalVoltage,
    });
  }

  // Self-discharge only lowers the resting voltage; a higher final reading is a measurement taken
  // before the cell settled (or after a charge), and would report a negative discharge rate.
  if (finalVoltage > initialVoltage) {
    throw inputRangeError('finalVoltage must not exceed initialVoltage', {
      code: 'parameter_out_of_range', parameter: 'finalVoltage', max: initialVoltage, got: finalVoltage,
    });
  }
  if (limitMvPerDay !== undefined && !(limitMvPerDay > 0)) {
    throw inputRangeError('limitMvPerDay must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'limitMvPerDay', exclusive_min: 0, got: limitMvPerDay,
    });
  }
  const totalVoltageDrop = initialVoltage - finalVoltage;
  const voltageDropPerDay = roundTo(totalVoltageDrop / days, 6);
  const voltageDropMvPerDay = roundTo((totalVoltageDrop * 1000) / days, 3);
  const dailyRatePercent = roundTo((voltageDropPerDay / nominalVoltage) * 100, 4);
  const monthlyRatePercent = roundTo(dailyRatePercent * 30, 2);

  const result: SelfDischargeResult = { voltageDropPerDay, voltageDropMvPerDay, monthlyRatePercent, dailyRatePercent };
  if (limitMvPerDay !== undefined) result.withinLimit = voltageDropMvPerDay <= limitMvPerDay;
  return result;
}
