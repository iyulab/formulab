import { inputRangeError } from '../errors.js';
import { roundTo, requireFinite } from '../utils.js';
import type { DegreeDayInput, DegreeDayResult } from './types.js';

/**
 * Degree Day (HDD/CDD) Calculator — ISO 50001 EnB
 *
 * @formula
 *   - HDD = Σ max(0, T_base_heating − T_daily)
 *   - CDD = Σ max(0, T_daily − T_base_cooling)
 *
 * @reference ASHRAE Fundamentals Handbook — Degree Day Method
 * @reference ISO 50001:2018 — Energy management systems
 * @throws RangeError if dailyTemps is empty, or baseHeating is above baseCooling
 */
export function degreeDay(input: DegreeDayInput): DegreeDayResult {
  requireFinite('degreeDay', input);
  const { dailyTemps, baseHeating = 18, baseCooling = 24 } = input;
  const totalDays = dailyTemps.length;

  if (totalDays === 0) {
    throw inputRangeError('dailyTemps must not be empty', { code: 'empty_input', parameter: 'dailyTemps' });
  }

  // A heating base above the cooling base would count a day between them as heating and cooling at once,
  // and the neutral days (total − heating − cooling) would go negative.
  if (baseHeating > baseCooling) {
    throw inputRangeError('baseHeating must not exceed baseCooling', {
      code: 'parameter_out_of_range', parameter: 'baseHeating', max: baseCooling, got: baseHeating,
    });
  }

  let hdd = 0;
  let cdd = 0;
  let heatingDays = 0;
  let coolingDays = 0;
  let sum = 0;

  for (const temp of dailyTemps) {
    sum += temp;
    const hddContrib = Math.max(0, baseHeating - temp);
    const cddContrib = Math.max(0, temp - baseCooling);
    hdd += hddContrib;
    cdd += cddContrib;
    if (hddContrib > 0) heatingDays++;
    if (cddContrib > 0) coolingDays++;
  }

  const neutralDays = totalDays - heatingDays - coolingDays;
  const avgTemp = sum / totalDays;

  return {
    hdd: roundTo(hdd, 2),
    cdd: roundTo(cdd, 2),
    totalDays,
    heatingDays,
    coolingDays,
    neutralDays,
    avgTemp: roundTo(avgTemp, 2),
  };
}
