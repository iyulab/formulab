import { roundTo } from '../utils.js';
import type { BatteryChemistry, CycleLifeInput, CycleLifeResult } from './types.js';

/**
 * Base cycle life by battery chemistry (at ~80% DOD, 25°C)
 * @reference Manufacturer datasheets, Battery University
 */
const BASE_CYCLE_LIFE: Record<BatteryChemistry, number> = {
  LFP: 3500,
  NMC: 1500,
  NCA: 1000,
  LTO: 15000,
  LCO: 800,
  LeadAcid: 500,
  NiMH: 600,
};

/**
 * DOD factor: how depth of discharge affects cycle life
 * ≤50% → 1.5, 50-80% → 1.0, >80% → 0.7 (with linear interpolation)
 */
function getDodFactor(dod: number): number {
  if (dod <= 50) {
    // Linear from 1.5 at 0% to 1.5 at 50%
    return 1.5;
  } else if (dod <= 80) {
    // Linear from 1.5 at 50% to 1.0 at 80%
    return 1.5 - ((dod - 50) / 30) * 0.5;
  } else {
    // Linear from 1.0 at 80% to 0.7 at 100%
    return 1.0 - ((dod - 80) / 20) * 0.3;
  }
}

/**
 * Temperature factor: how temperature affects cycle life
 * <0°C → 0.5, 0-15 → 0.8, 15-35 → 1.0, 35-45 → 0.8, >45 → 0.5
 */
function getTemperatureFactor(tempC: number): number {
  if (tempC < 0) return 0.5;
  if (tempC < 15) return 0.8;
  if (tempC <= 35) return 1.0;
  if (tempC <= 45) return 0.8;
  return 0.5;
}

/**
 * Estimate battery cycle life based on chemistry, DOD, and temperature
 *
 * @formula cycles = baseCycles × dodFactor × temperatureFactor
 * @reference Battery University, manufacturer datasheets
 * @param input - Chemistry type, DOD percentage, temperature
 * @returns Estimated cycle count with adjustment factors
 */
export function cycleLife(input: CycleLifeInput): CycleLifeResult {
  const { chemistry, depthOfDischarge, temperatureC } = input;

  const baseCycles = BASE_CYCLE_LIFE[chemistry];
  const dodFactor = getDodFactor(depthOfDischarge);
  const temperatureFactor = getTemperatureFactor(temperatureC);

  const estimatedCycles = roundTo(baseCycles * dodFactor * temperatureFactor, 0);

  return {
    estimatedCycles,
    baseCycles,
    dodFactor: roundTo(dodFactor, 4),
    temperatureFactor,
    chemistry,
  };
}
