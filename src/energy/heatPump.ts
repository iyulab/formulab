import { roundTo } from '../utils.js';
import type { HeatPumpInput, HeatPumpResult } from './types.js';

/**
 * Heat Pump COP Calculator
 *
 * @formula
 *   - COP = heatingCapacity / (compressorPower + auxiliaryPower)
 *   - COP_Carnot = T_sink / (T_sink − T_source)  (Kelvin)
 *   - Efficiency = COP / COP_Carnot × 100
 *
 * @reference EN 14511 — Air conditioners, liquid chilling packages and heat pumps
 */
export function heatPump(input: HeatPumpInput): HeatPumpResult {
  const {
    sourceTemp, sinkTemp, heatingCapacity, compressorPower,
    auxiliaryPower = 0, operatingHours, electricityRate,
    boilerEfficiency, fuelCost,
  } = input;

  const totalPower = compressorPower + auxiliaryPower;
  const cop = totalPower > 0 ? heatingCapacity / totalPower : 0;

  // Carnot COP (theoretical maximum)
  const tSinkK = sinkTemp + 273.15;
  const tSourceK = sourceTemp + 273.15;
  const deltaT = tSinkK - tSourceK;
  const copCarnot = deltaT > 0 ? tSinkK / deltaT : 0;

  const efficiency = copCarnot > 0 ? roundTo((cop / copCarnot) * 100, 2) : 0;

  // Annual calculations
  let annualElectricity: number | null = null;
  let annualElecCost: number | null = null;
  let annualFuelCost: number | null = null;
  let annualSavings: number | null = null;

  if (operatingHours != null) {
    annualElectricity = roundTo(totalPower * operatingHours, 2);

    if (electricityRate != null) {
      annualElecCost = roundTo(annualElectricity * electricityRate, 2);

      if (boilerEfficiency != null && fuelCost != null && boilerEfficiency > 0) {
        const heatDelivered = heatingCapacity * operatingHours;
        annualFuelCost = roundTo((heatDelivered / boilerEfficiency) * fuelCost, 2);
        annualSavings = roundTo(annualFuelCost - annualElecCost, 2);
      }
    }
  }

  return {
    cop: roundTo(cop, 3),
    copCarnot: roundTo(copCarnot, 3),
    efficiency,
    annualElectricity,
    annualElecCost,
    annualFuelCost,
    annualSavings,
  };
}
