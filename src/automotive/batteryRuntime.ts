import { roundTo } from '../utils.js';
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
 */
export function batteryRuntime(input: BatteryInput): BatteryResult {
  const { capacityAh, voltageV, loadW, efficiency } = input;

  // Handle edge cases
  if (voltageV <= 0 || loadW <= 0) {
    return {
      energyWh: voltageV > 0 ? roundTo(capacityAh * voltageV, 2) : 0,
      energyKwh: voltageV > 0 ? roundTo((capacityAh * voltageV) / 1000, 2) : 0,
      runtimeHours: 0,
      runtimeMinutes: 0,
      currentDraw: 0,
    };
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
