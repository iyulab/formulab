import { roundTo } from '../utils.js';
import type { OhmsLawInput, OhmsLawResult } from './types.js';

/**
 * Ohm's Law Calculator — V = I × R, P = V × I
 *
 * Solves for any one of voltage, current, resistance, or power
 * given the other two known quantities.
 *
 * @throws {RangeError} Current must be positive
 * @throws {RangeError} Resistance must be positive
 * @throws {RangeError} Voltage must be non-negative
 * @param input - discriminated union by `solveFor`
 * @returns all four electrical quantities
 */
export function ohmsLaw(input: OhmsLawInput): OhmsLawResult {
  let voltage: number;
  let current: number;
  let resistance: number;
  let power: number;

  switch (input.solveFor) {
    case 'voltage': {
      current = input.current;
      resistance = input.resistance;
      if (current <= 0) throw new Error('Current must be positive');
      if (resistance <= 0) throw new Error('Resistance must be positive');
      voltage = current * resistance;
      power = voltage * current;
      break;
    }
    case 'current': {
      voltage = input.voltage;
      resistance = input.resistance;
      if (voltage < 0) throw new Error('Voltage must be non-negative');
      if (resistance <= 0) throw new Error('Resistance must be positive');
      current = voltage / resistance;
      power = voltage * current;
      break;
    }
    case 'resistance': {
      voltage = input.voltage;
      current = input.current;
      if (voltage < 0) throw new Error('Voltage must be non-negative');
      if (current <= 0) throw new Error('Current must be positive');
      resistance = voltage / current;
      power = voltage * current;
      break;
    }
    case 'power': {
      voltage = input.voltage;
      current = input.current;
      if (voltage < 0) throw new Error('Voltage must be non-negative');
      if (current <= 0) throw new Error('Current must be positive');
      resistance = voltage / current;
      power = voltage * current;
      break;
    }
  }

  return {
    voltage: roundTo(voltage, 4),
    current: roundTo(current, 6),
    resistance: roundTo(resistance, 4),
    power: roundTo(power, 4),
  };
}
