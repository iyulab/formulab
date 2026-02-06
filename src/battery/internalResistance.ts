import { roundTo } from '../utils.js';
import type { InternalResistanceInput, InternalResistanceResult } from './types.js';

/**
 * Calculate battery internal resistance from OCV and load voltage
 *
 * @formula R = (OCV - Vload) / I
 * @reference IEC 61960, direct current internal resistance (DCIR)
 * @param input - Open circuit voltage, load voltage, and load current
 * @returns Resistance in Ohm and mOhm, voltage drop, and power loss
 */
export function internalResistance(input: InternalResistanceInput): InternalResistanceResult {
  const { openCircuitVoltage, loadVoltage, loadCurrentA } = input;

  const voltageDrop = roundTo(openCircuitVoltage - loadVoltage, 4);
  const resistanceOhm = roundTo(voltageDrop / loadCurrentA, 6);
  const resistanceMilliOhm = roundTo(resistanceOhm * 1000, 3);
  const powerLossW = roundTo(loadCurrentA * loadCurrentA * resistanceOhm, 4);

  return { resistanceOhm, resistanceMilliOhm, voltageDrop, powerLossW };
}
