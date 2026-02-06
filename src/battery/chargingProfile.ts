import { roundTo } from '../utils.js';
import type { ChargingProfileInput, ChargingProfileResult } from './types.js';

/**
 * Calculate CC-CV charging profile timing
 *
 * @formula CC: t = ccAh / I, CV: t ≈ cvAh / ((Icc + Icut) / 2)
 * @reference Li-ion CC-CV charging protocol
 * @param input - Battery capacity, charging current, cutoff current, CC end SOC
 * @returns Phase durations, Ah delivered per phase, average C-rate
 */
export function chargingProfile(input: ChargingProfileInput): ChargingProfileResult {
  const {
    capacityAh,
    chargingCurrentA,
    cutoffCurrentA,
    ccEndSocPercent = 80,
  } = input;

  // CC phase delivers ccEndSocPercent of capacity
  const ccPhaseAh = roundTo(capacityAh * (ccEndSocPercent / 100), 2);
  const cvPhaseAh = roundTo(capacityAh - ccPhaseAh, 2);

  // CC phase time = Ah / current
  const ccPhaseTimeH = roundTo(ccPhaseAh / chargingCurrentA, 2);
  const ccPhaseTimeMin = roundTo(ccPhaseTimeH * 60, 1);

  // CV phase time approximation: average current = (Icc + Icut) / 2
  const avgCvCurrent = (chargingCurrentA + cutoffCurrentA) / 2;
  const cvPhaseTimeH = roundTo(cvPhaseAh / avgCvCurrent, 2);
  const cvPhaseTimeMin = roundTo(cvPhaseTimeH * 60, 1);

  const totalTimeH = roundTo(ccPhaseTimeH + cvPhaseTimeH, 2);
  const totalTimeMin = roundTo(totalTimeH * 60, 1);

  // Average C-rate over entire charge
  const averageCRate = roundTo(capacityAh / (totalTimeH * capacityAh), 4);

  return {
    ccPhaseTimeH,
    ccPhaseTimeMin,
    cvPhaseTimeH,
    cvPhaseTimeMin,
    totalTimeH,
    totalTimeMin,
    ccPhaseAh,
    cvPhaseAh,
    averageCRate,
  };
}
