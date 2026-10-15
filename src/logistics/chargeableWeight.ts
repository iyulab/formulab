import { roundTo, requireFinite } from '../utils.js';
import type { FreightMode, ChargeableWeightInput, ChargeableWeightResult } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Volumetric weight per cubic metre of cargo, by freight mode (kg/m³) — the reciprocal of the
 * carrier's DIM divisor.
 *
 * @reference air — IATA volumetric rule 6000 cm³/kg, quoted as 1 m³ = 167 kg.
 * @reference express — integrator (courier) divisor 5000 cm³/kg → 200 kg/m³.
 * @reference ocean — weight-or-measure (W/M): 1 m³ is charged as 1 revenue tonne (1000 kg).
 * @reference truck — road freight convention 3 m³ = 1 t → 333 kg/m³.
 */
export const VOLUMETRIC_KG_PER_M3: Readonly<Record<FreightMode, number>> = {
  air: 167,
  express: 200,
  ocean: 1000,
  truck: 333,
};

/**
 * Chargeable weight of a shipment: the greater of its actual weight and the weight its volume
 * counts as in the given freight mode.
 *
 * @formula volumetric weight = volume × factor(mode); chargeable = max(actual, volumetric)
 *
 * @units volume: m³ · actualWeight: kg · output: kg
 *
 * @param input - Shipment volume, actual weight and freight mode
 * @returns Volumetric and chargeable weight, and which of the two governs
 * @throws {RangeError} volume is not greater than 0, actualWeight is negative, or the mode is unknown
 */
export function chargeableWeight(input: ChargeableWeightInput): ChargeableWeightResult {
  requireFinite('chargeableWeight', input);
  const { volume, actualWeight, mode } = input;

  if (!(volume > 0)) {
    throw new InputRangeError('volume must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'volume', exclusive_min: 0, got: volume,
    });
  }
  if (actualWeight < 0) {
    throw new InputRangeError('actualWeight must not be negative', {
      code: 'parameter_out_of_range', parameter: 'actualWeight', min: 0, got: actualWeight,
    });
  }
  if (!Object.hasOwn(VOLUMETRIC_KG_PER_M3, mode)) throw new RangeError(`unknown freight mode: ${String(mode)}`);

  const volumetricFactor = VOLUMETRIC_KG_PER_M3[mode];
  const volumetricWeight = roundTo(volume * volumetricFactor, 2);
  return {
    volumetricFactor,
    volumetricWeight,
    chargeableWeight: roundTo(Math.max(actualWeight, volumetricWeight), 2),
    isVolumetricHigher: volumetricWeight > actualWeight,
  };
}
