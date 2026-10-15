import { roundTo, requireFinite } from '../utils.js';
import type { EnergyDensityInput, EnergyDensityResult } from './types.js';
import { InputRangeError } from '../errors.js';

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
    throw new InputRangeError('capacityAh must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'capacityAh', exclusive_min: 0, got: capacityAh,
    });
  }
  if (!(nominalVoltage > 0)) {
    throw new InputRangeError('nominalVoltage must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'nominalVoltage', exclusive_min: 0, got: nominalVoltage,
    });
  }
  // A given mass or volume is a measurement; zero or negative is not one, so it is refused
  // rather than silently reported as "no density".
  if (massKg != null && !(massKg > 0)) {
    throw new InputRangeError('massKg must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'massKg', exclusive_min: 0, got: massKg,
    });
  }
  if (volumeL != null && !(volumeL > 0)) {
    throw new InputRangeError('volumeL must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'volumeL', exclusive_min: 0, got: volumeL,
    });
  }

  const energyWh = roundTo(capacityAh * nominalVoltage, 2);
  const gravimetricWhPerKg = massKg != null ? roundTo(energyWh / massKg, 2) : null;
  const volumetricWhPerL = volumeL != null ? roundTo(energyWh / volumeL, 2) : null;

  return { energyWh, gravimetricWhPerKg, volumetricWhPerL };
}
