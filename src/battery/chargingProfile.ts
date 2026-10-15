import { roundTo, requireFinite } from '../utils.js';
import type { ChargingProfileInput, ChargingProfileResult } from './types.js';
import { InputRangeError } from '../errors.js';

/**
 * Calculate CC-CV charging profile timing
 *
 * @formula CC: t = ccAh / I, CV: t ≈ cvAh / ((Icc + Icut) / 2)
 * @reference Li-ion CC-CV charging protocol
 * @param input - Battery capacity, charging current, cutoff current, CC end SOC
 * @returns Phase durations, Ah delivered per phase, average C-rate
 */
export function chargingProfile(input: ChargingProfileInput): ChargingProfileResult {
  requireFinite('chargingProfile', input);
  const {
    capacityAh,
    chargingCurrentA,
    cutoffCurrentA,
    ccEndSocPercent = 80,
  } = input;

  if (!(capacityAh > 0)) {
    throw new InputRangeError('capacityAh must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'capacityAh', exclusive_min: 0, got: capacityAh,
    });
  }
  if (!(chargingCurrentA > 0)) {
    throw new InputRangeError('chargingCurrentA must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'chargingCurrentA', exclusive_min: 0, got: chargingCurrentA,
    });
  }
  // The CV phase averages the charging and cutoff currents; a non-positive cutoff would
  // make that average zero or negative and the phase time infinite.
  if (!(cutoffCurrentA > 0)) {
    throw new InputRangeError('cutoffCurrentA must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'cutoffCurrentA', exclusive_min: 0, got: cutoffCurrentA,
    });
  }
  if (!(ccEndSocPercent > 0) || ccEndSocPercent >= 100) {
    throw new InputRangeError('ccEndSocPercent must be greater than 0 and less than 100', {
      code: 'parameter_out_of_range', parameter: 'ccEndSocPercent', exclusive_min: 0, exclusive_max: 100, got: ccEndSocPercent,
    });
  }

  // Every output is rounded once, from the unrounded value. Deriving minutes from the rounded
  // hours (or the C-rate from the rounded total) would carry the hour rounding into them.
  const ccAh = capacityAh * (ccEndSocPercent / 100);
  const cvAh = capacityAh - ccAh;

  // CC phase time = Ah / current
  const ccH = ccAh / chargingCurrentA;
  // CV phase time approximation: average current = (Icc + Icut) / 2
  const cvH = cvAh / ((chargingCurrentA + cutoffCurrentA) / 2);
  const totalH = ccH + cvH;

  const ccPhaseAh = roundTo(ccAh, 2);
  const cvPhaseAh = roundTo(cvAh, 2);
  const ccPhaseTimeH = roundTo(ccH, 2);
  const ccPhaseTimeMin = roundTo(ccH * 60, 1);
  const cvPhaseTimeH = roundTo(cvH, 2);
  const cvPhaseTimeMin = roundTo(cvH * 60, 1);
  const totalTimeH = roundTo(totalH, 2);
  const totalTimeMin = roundTo(totalH * 60, 1);

  // Average C-rate over the entire charge: one capacity delivered over the total time
  const averageCRate = roundTo(1 / totalH, 4);

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
