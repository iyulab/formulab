import { roundTo } from '../utils.js';
import type { EnergyDensityInput, EnergyDensityResult } from './types.js';

/**
 * Calculate battery energy density (gravimetric and volumetric)
 *
 * @formula Wh = Ah × V, Wh/kg = Wh / mass, Wh/L = Wh / volume
 * @param input - Battery capacity, voltage, and optionally mass/volume
 * @returns Energy in Wh, gravimetric (Wh/kg), and volumetric (Wh/L) density
 */
export function energyDensity(input: EnergyDensityInput): EnergyDensityResult {
  const { capacityAh, nominalVoltage, massKg, volumeL } = input;

  const energyWh = roundTo(capacityAh * nominalVoltage, 2);
  const gravimetricWhPerKg = massKg != null && massKg > 0
    ? roundTo(energyWh / massKg, 2)
    : null;
  const volumetricWhPerL = volumeL != null && volumeL > 0
    ? roundTo(energyWh / volumeL, 2)
    : null;

  return { energyWh, gravimetricWhPerKg, volumetricWhPerL };
}
