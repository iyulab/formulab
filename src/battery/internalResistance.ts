import { roundTo, requireFinite } from '../utils.js';
import type { InternalResistanceInput, InternalResistanceResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate battery internal resistance from OCV and load voltage
 *
 * @formula R = (OCV - Vload) / I
 * @reference IEC 61960, direct current internal resistance (DCIR)
 * @param input - Open circuit voltage, load voltage, and load current
 * @returns Resistance in Ohm and mOhm, voltage drop, and power loss
 * @throws {RangeError} openCircuitVoltage or loadVoltage is negative, or loadCurrentA is not
 *   greater than 0
 */
export function internalResistance(input: InternalResistanceInput): InternalResistanceResult {
  requireFinite('internalResistance', input);
  const { openCircuitVoltage, loadVoltage, loadCurrentA } = input;

  // A terminal voltage below zero is not a cell under load; it flips the sign of the drop.
  if (!(openCircuitVoltage >= 0)) {
    throw inputRangeError('openCircuitVoltage must not be negative', {
      code: 'parameter_out_of_range', parameter: 'openCircuitVoltage', min: 0, got: openCircuitVoltage,
    });
  }
  if (!(loadVoltage >= 0)) {
    throw inputRangeError('loadVoltage must not be negative', {
      code: 'parameter_out_of_range', parameter: 'loadVoltage', min: 0, got: loadVoltage,
    });
  }
  if (!(loadCurrentA > 0)) {
    throw inputRangeError('loadCurrentA must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'loadCurrentA', exclusive_min: 0, got: loadCurrentA,
    });
  }

  // Under load the terminal voltage sags below the open-circuit voltage; a higher one would mean a
  // negative internal resistance — the two readings do not belong to one discharge.
  if (loadVoltage > openCircuitVoltage) {
    throw inputRangeError('loadVoltage must not exceed openCircuitVoltage', {
      code: 'parameter_out_of_range', parameter: 'loadVoltage', max: openCircuitVoltage, got: loadVoltage,
    });
  }
  const voltageDrop = roundTo(openCircuitVoltage - loadVoltage, 4);
  const resistanceOhm = roundTo(voltageDrop / loadCurrentA, 6);
  const resistanceMilliOhm = roundTo(resistanceOhm * 1000, 3);
  const powerLossW = roundTo(loadCurrentA * loadCurrentA * resistanceOhm, 4);

  return { resistanceOhm, resistanceMilliOhm, voltageDrop, powerLossW };
}
