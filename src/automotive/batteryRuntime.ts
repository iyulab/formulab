import { roundTo, requireFinite } from '../utils.js';
import type { BatteryInput, BatteryResult } from './types.js';

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
    throw new RangeError('capacityAh must be greater than 0');
  }
  if (!(voltageV > 0)) {
    throw new RangeError('voltageV must be greater than 0');
  }
  if (!(loadW > 0)) {
    throw new RangeError('loadW must be greater than 0');
  }
  // A negative efficiency returns a negative runtime, and one above 1 creates energy.
  if (!(efficiency > 0 && efficiency <= 1)) {
    throw new RangeError('efficiency must be greater than 0 and at most 1');
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
