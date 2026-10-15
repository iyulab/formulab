import { roundTo, requireFinite } from '../utils.js';
import type { BatteryInput, BatteryResult } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate battery runtime based on capacity, voltage, and load
 *
 * Formula:
 * - Energy (Wh) = Capacity (Ah) x Voltage (V)
 * - Runtime (h) = Energy (Wh) x Efficiency / Load (W)
 * - Current Draw (A) = Load (W) / Voltage (V)
 *
 * @param input - Battery parameters
 * @returns Battery result with energy and runtime
 * @throws RangeError if capacityAh, voltageV, or loadW is not greater than 0, or efficiency is
 *   not in (0, 1]
 */
export function batteryRuntime(input: BatteryInput): BatteryResult {
  requireFinite('batteryRuntime', input);
  const { capacityAh, voltageV, loadW, efficiency } = input;

  if (!(capacityAh > 0)) {
    throw new InputRangeError('capacityAh must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'capacityAh', exclusive_min: 0, got: capacityAh,
    });
  }
  if (!(voltageV > 0)) {
    throw new InputRangeError('voltageV must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'voltageV', exclusive_min: 0, got: voltageV,
    });
  }
  if (!(loadW > 0)) {
    throw new InputRangeError('loadW must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'loadW', exclusive_min: 0, got: loadW,
    });
  }
  // A negative efficiency returns a negative runtime, and one above 1 creates energy.
  if (!(efficiency > 0 && efficiency <= 1)) {
    throw new InputRangeError('efficiency must be greater than 0 and at most 1', {
      code: 'parameter_out_of_range', parameter: 'efficiency', exclusive_min: 0, max: 1, got: efficiency,
    });
  }

  const energyWh = capacityAh * voltageV;
  const energyKwh = energyWh / 1000;
  const runtimeHours = (energyWh * efficiency) / loadW;
  const runtimeMinutes = runtimeHours * 60;
  const currentDraw = loadW / voltageV;

  return {
    energyWh: roundTo(energyWh, 2),
    energyKwh: roundTo(energyKwh, 2),
    runtimeHours: roundTo(runtimeHours, 2),
    runtimeMinutes: roundTo(runtimeMinutes, 2),
    currentDraw: roundTo(currentDraw, 2),
  };
}
