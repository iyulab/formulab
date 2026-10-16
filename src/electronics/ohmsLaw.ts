import { roundTo, requireFinite } from '../utils.js';
import type { OhmsLawInput, OhmsLawResult } from './types.js';
import { inputRangeError } from '../errors.js';

function requirePositive(parameter: 'current' | 'resistance', message: string, value: number): void {
  if (value <= 0) {
    throw inputRangeError(message, {
      code: 'parameter_out_of_range', parameter, exclusive_min: 0, got: value,
    });
  }
}

function requireNonNegativeVoltage(voltage: number): void {
  if (voltage < 0) {
    throw inputRangeError('Voltage must be non-negative', {
      code: 'parameter_out_of_range', parameter: 'voltage', min: 0, got: voltage,
    });
  }
}

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
  requireFinite('ohmsLaw', input);
  let voltage: number;
  let current: number;
  let resistance: number;
  let power: number;

  switch (input.solveFor) {
    case 'voltage': {
      current = input.current;
      resistance = input.resistance;
      requirePositive('current', 'Current must be positive', current);
      requirePositive('resistance', 'Resistance must be positive', resistance);
      voltage = current * resistance;
      power = voltage * current;
      break;
    }
    case 'current': {
      voltage = input.voltage;
      resistance = input.resistance;
      requireNonNegativeVoltage(voltage);
      requirePositive('resistance', 'Resistance must be positive', resistance);
      current = voltage / resistance;
      power = voltage * current;
      break;
    }
    case 'resistance': {
      voltage = input.voltage;
      current = input.current;
      requireNonNegativeVoltage(voltage);
      requirePositive('current', 'Current must be positive', current);
      resistance = voltage / current;
      power = voltage * current;
      break;
    }
    case 'power': {
      voltage = input.voltage;
      current = input.current;
      requireNonNegativeVoltage(voltage);
      requirePositive('current', 'Current must be positive', current);
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
