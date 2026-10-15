import { roundTo, requireFinite } from '../utils.js';
import type { ChargingProfileInput, ChargingProfileResult } from './types.js';
import { InputRangeError } from '../errors.js';

/** Samples of the CV taper in `currentCurve` (the CC phase is flat and needs only its two ends). */
const CV_CURVE_SAMPLES = 24;

/**
 * Calculate CC-CV charging profile timing
 *
 * The CV phase is modelled as a first-order exponential taper of the current, I(t) = Icc·e^(−t/τ), the
 * usual approximation of a cell held at its voltage ceiling (its current falls like an RC charge). The
 * charge it delivers is fixed by the CC end SOC, and ∫ I dt from Icc down to Icut is τ·(Icc − Icut), so
 * τ follows from the inputs and needs no constant of its own. Equivalently, the CV phase runs at the
 * logarithmic mean of Icc and Icut — slower than their arithmetic mean, which a straight-line taper
 * would assume and which understates the CV time (by about 40 % at Icc/Icut = 20).
 *
 * @formula CC: t = ccAh / Icc · CV: τ = cvAh / (Icc − Icut), t = τ · ln(Icc / Icut)
 * @reference Li-ion CC-CV charging protocol (IEC 61960 / IEC 62660-1 charge procedures); exponential CV taper
 * @param input - Battery capacity, charging current, cutoff current, CC end SOC
 * @returns Phase durations, Ah delivered per phase, average C-rate, the CV time constant and the current curve
 * @throws {RangeError} capacity, charging or cutoff current ≤ 0; cutoff current ≥ charging current;
 *   CC end SOC outside (0, 100)
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
  // The CV taper ends when the current falls to the cutoff: a cutoff of zero is never reached, and one at
  // or above the charging current leaves no taper to carry the CV charge.
  if (!(cutoffCurrentA > 0)) {
    throw new InputRangeError('cutoffCurrentA must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'cutoffCurrentA', exclusive_min: 0, got: cutoffCurrentA,
    });
  }
  if (!(cutoffCurrentA < chargingCurrentA)) {
    throw new InputRangeError('cutoffCurrentA must be less than chargingCurrentA', {
      code: 'parameter_out_of_range', parameter: 'cutoffCurrentA', exclusive_max: chargingCurrentA, got: cutoffCurrentA,
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
  // CV phase: exponential taper from Icc to Icut carrying cvAh
  const tauH = cvAh / (chargingCurrentA - cutoffCurrentA);
  const cvH = tauH * Math.log(chargingCurrentA / cutoffCurrentA);
  const totalH = ccH + cvH;

  const currentCurve = [{ timeH: 0, currentA: chargingCurrentA }];
  for (let i = 0; i <= CV_CURVE_SAMPLES; i++) {
    const t = (cvH * i) / CV_CURVE_SAMPLES;
    // The last sample is the cutoff itself, not e^(−ln(Icc/Icut)) recomputed with rounding error.
    const currentA = i === CV_CURVE_SAMPLES ? cutoffCurrentA : chargingCurrentA * Math.exp(-t / tauH);
    currentCurve.push({ timeH: roundTo(ccH + t, 4), currentA: roundTo(currentA, 4) });
  }

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
    cvTimeConstantH: roundTo(tauH, 4),
    currentCurve,
  };
}
