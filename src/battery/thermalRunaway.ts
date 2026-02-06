import { roundTo } from '../utils.js';
import type { ThermalRunawayInput, ThermalRunawayResult } from './types.js';

/**
 * Calculate thermal runaway safety margin
 *
 * @formula Tss = Tamb + I²R/(hA), margin = Trunaway - Tss
 * @reference SAE J2464, UN 38.3
 * @param input - Ambient temp, current, IR, heat transfer parameters, runaway onset temp
 * @returns Steady-state temperature, safety margin, and safety status
 */
export function thermalRunaway(input: ThermalRunawayInput): ThermalRunawayResult {
  const {
    ambientTempC,
    currentA,
    internalResistanceOhm,
    heatTransferCoeff,
    surfaceAreaM2,
    runawayTempC,
  } = input;

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
