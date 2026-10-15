import { roundTo, requireFinite } from '../utils.js';
import type { ThermalRunawayInput, ThermalRunawayResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate thermal runaway safety margin
 *
 * @formula Tss = Tamb + I²R/(hA), margin = Trunaway - Tss
 * @reference SAE J2464, UN 38.3
 * @param input - Ambient temp, current, IR, heat transfer parameters, runaway onset temp
 * @returns Steady-state temperature, safety margin, and safety status
 * @throws {RangeError} internalResistanceOhm is negative, or heatTransferCoeff or surfaceAreaM2 is
 *   not greater than 0
 * @remarks currentA may be signed (charge vs discharge); the heat is I²R either way.
 */
export function thermalRunaway(input: ThermalRunawayInput): ThermalRunawayResult {
  requireFinite('thermalRunaway', input);
  const {
    ambientTempC,
    currentA,
    internalResistanceOhm,
    heatTransferCoeff,
    surfaceAreaM2,
    runawayTempC,
  } = input;

  // A negative resistance would absorb heat and report the cell cooler than ambient.
  if (!(internalResistanceOhm >= 0)) {
    throw inputRangeError('internalResistanceOhm must not be negative', {
      code: 'parameter_out_of_range', parameter: 'internalResistanceOhm', min: 0, got: internalResistanceOhm,
    });
  }
  // The steady-state rise divides the generated heat by hA; a non-positive coefficient
  // or area describes a cell that cannot shed heat at all, which is not a temperature.
  if (!(heatTransferCoeff > 0)) {
    throw inputRangeError('heatTransferCoeff must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'heatTransferCoeff', exclusive_min: 0, got: heatTransferCoeff,
    });
  }
  if (!(surfaceAreaM2 > 0)) {
    throw inputRangeError('surfaceAreaM2 must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'surfaceAreaM2', exclusive_min: 0, got: surfaceAreaM2,
    });
  }

  const heatGenerationW = roundTo(currentA * currentA * internalResistanceOhm, 4);
  const hA = heatTransferCoeff * surfaceAreaM2;
  const temperatureRiseC = roundTo(heatGenerationW / hA, 2);
  const steadyStateTempC = roundTo(ambientTempC + temperatureRiseC, 2);
  const heatDissipationW = roundTo(hA * temperatureRiseC, 4);
  const safetyMarginC = roundTo(runawayTempC - steadyStateTempC, 2);
  const isSafe = safetyMarginC > 0;

  return {
    steadyStateTempC,
    temperatureRiseC,
    heatGenerationW,
    heatDissipationW,
    safetyMarginC,
    isSafe,
  };
}
