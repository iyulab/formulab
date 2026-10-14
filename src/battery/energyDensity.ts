import { roundTo, requireFinite } from '../utils.js';
import type { EnergyDensityInput, EnergyDensityResult } from './types.js';

/**
 * Calculate battery energy density (gravimetric and volumetric)
 *
 * @formula Wh = Ah × V, Wh/kg = Wh / mass, Wh/L = Wh / volume
 * @param input - Battery capacity, voltage, and optionally mass/volume
 * @returns Energy in Wh, gravimetric (Wh/kg), and volumetric (Wh/L) density
 * @throws {RangeError} capacityAh or nominalVoltage is not greater than 0, or massKg / volumeL is
 *   given and not greater than 0 (an omitted one gives a null density)
 */
export function energyDensity(input: EnergyDensityInput): EnergyDensityResult {
  requireFinite('energyDensity', input);
  const { capacityAh, nominalVoltage, massKg, volumeL } = input;

  // A negative capacity or voltage returns a negative energy and negative densities.
  if (!(capacityAh > 0)) {
    throw new RangeError('capacityAh must be greater than 0');
  }
  if (!(nominalVoltage > 0)) {
    throw new RangeError('nominalVoltage must be greater than 0');
  }
  // A given mass or volume is a measurement; zero or negative is not one, so it is refused
  // rather than silently reported as "no density".
  if (massKg != null && !(massKg > 0)) {
    throw new RangeError('massKg must be greater than 0');
  }
  if (volumeL != null && !(volumeL > 0)) {
    throw new RangeError('volumeL must be greater than 0');
  }

  const energyWh = roundTo(capacityAh * nominalVoltage, 2);
  const gravimetricWhPerKg = massKg != null ? roundTo(energyWh / massKg, 2) : null;
  const volumetricWhPerL = volumeL != null ? roundTo(energyWh / volumeL, 2) : null;

  return { energyWh, gravimetricWhPerKg, volumetricWhPerL };
}
