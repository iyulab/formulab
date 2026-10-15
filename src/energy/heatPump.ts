import { roundTo, requireFinite } from '../utils.js';
import type { HeatPumpInput, HeatPumpResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Heat Pump COP Calculator
 *
 * @formula
 *   - COP = heatingCapacity / (compressorPower + auxiliaryPower)
 *   - COP_Carnot = T_sink / (T_sink − T_source)  (Kelvin)
 *   - Efficiency = COP / COP_Carnot × 100
 *
 * @reference EN 14511 — Air conditioners, liquid chilling packages and heat pumps
 *
 * @throws {RangeError} compressorPower is not greater than 0 (the COP divides by the electrical
 *   input); heatingCapacity, auxiliaryPower, operatingHours, electricityRate or fuelCost is
 *   negative; or boilerEfficiency, when given, is outside (0, 1]
 */
export function heatPump(input: HeatPumpInput): HeatPumpResult {
  requireFinite('heatPump', input);
  const {
    sourceTemp, sinkTemp, heatingCapacity, compressorPower,
    auxiliaryPower = 0, operatingHours, electricityRate,
    boilerEfficiency, fuelCost,
  } = input;

  // The COP is the heat delivered per unit of electrical input, so a pump with no compressor
  // input has no COP to report; a negative capacity, power, duration or price flips its sign.
  if (!(compressorPower > 0)) {
    throw inputRangeError('compressorPower must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'compressorPower', exclusive_min: 0, got: compressorPower,
    });
  }
  if (!(heatingCapacity >= 0)) {
    throw inputRangeError('heatingCapacity must not be negative', {
      code: 'parameter_out_of_range', parameter: 'heatingCapacity', min: 0, got: heatingCapacity,
    });
  }
  if (!(auxiliaryPower >= 0)) {
    throw inputRangeError('auxiliaryPower must not be negative', {
      code: 'parameter_out_of_range', parameter: 'auxiliaryPower', min: 0, got: auxiliaryPower,
    });
  }
  if (operatingHours != null && !(operatingHours >= 0)) {
    throw inputRangeError('operatingHours must not be negative', {
      code: 'parameter_out_of_range', parameter: 'operatingHours', min: 0, got: operatingHours,
    });
  }
  if (electricityRate != null && !(electricityRate >= 0)) {
    throw inputRangeError('electricityRate must not be negative', {
      code: 'parameter_out_of_range', parameter: 'electricityRate', min: 0, got: electricityRate,
    });
  }
  if (fuelCost != null && !(fuelCost >= 0)) {
    throw inputRangeError('fuelCost must not be negative', {
      code: 'parameter_out_of_range', parameter: 'fuelCost', min: 0, got: fuelCost,
    });
  }
  // The boiler comparison divides the delivered heat by the boiler efficiency.
  if (boilerEfficiency != null && (!(boilerEfficiency > 0) || boilerEfficiency > 1)) {
    throw inputRangeError('boilerEfficiency must be greater than 0 and at most 1', {
      code: 'parameter_out_of_range', parameter: 'boilerEfficiency', exclusive_min: 0, max: 1, got: boilerEfficiency,
    });
  }

  const totalPower = compressorPower + auxiliaryPower;
  const cop = heatingCapacity / totalPower;

  // Carnot COP (theoretical maximum)
  const tSinkK = sinkTemp + 273.15;
  const tSourceK = sourceTemp + 273.15;
  const deltaT = tSinkK - tSourceK;
  const copCarnot = deltaT > 0 ? tSinkK / deltaT : null;

  const efficiency = copCarnot !== null ? roundTo((cop / copCarnot) * 100, 2) : null;

  // Annual calculations
  let annualElectricity: number | null = null;
  let annualElecCost: number | null = null;
  let annualFuelCost: number | null = null;
  let annualSavings: number | null = null;

  if (operatingHours != null) {
    annualElectricity = roundTo(totalPower * operatingHours, 2);

    if (electricityRate != null) {
      annualElecCost = roundTo(annualElectricity * electricityRate, 2);

      if (boilerEfficiency != null && fuelCost != null) {
        const heatDelivered = heatingCapacity * operatingHours;
        annualFuelCost = roundTo((heatDelivered / boilerEfficiency) * fuelCost, 2);
        annualSavings = roundTo(annualFuelCost - annualElecCost, 2);
      }
    }
  }

  return {
    cop: roundTo(cop, 3),
    copCarnot: copCarnot === null ? null : roundTo(copCarnot, 3),
    efficiency,
    annualElectricity,
    annualElecCost,
    annualFuelCost,
    annualSavings,
  };
}
