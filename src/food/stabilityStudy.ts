import { roundTo, requireFinite } from '../utils.js';
import type { StabilityStudyInput, StabilityStudyResult } from './types.js';
import { InputRangeError } from '../errors.js';

const R = 8.314e-3; // Gas constant in kJ/(mol·K)

/**
 * Accelerated Stability Study — Arrhenius Regression (ICH Q1A)
 *
 * @formula
 *   - k = A × exp(−Ea / (R×T))
 *   - ln(k) vs 1/T → linear regression → Ea = −slope × R
 *   - Predicted shelf life = criterion / k(T_storage)
 *   - Q10 = exp(Ea × 10 / (R × T₁ × T₂))
 *
 * @reference ICH Q1A(R2) — Stability Testing of New Drug Substances and Products
 * @reference Labuza, T.P. "Shelf Life Dating of Foods" (1982)
 *
 * @returns `r2` is `null` when every temperature degrades at the same rate
 * @throws {RangeError} shelfLifeCriterion is not greater than 0; storageTemp or a data point
 *   temperature is at or below absolute zero; fewer than 2 temperatures show a rising degradation
 *   (there is no Arrhenius line to extrapolate); or the extrapolation is not representable
 */
export function stabilityStudy(input: StabilityStudyInput): StabilityStudyResult {
  requireFinite('stabilityStudy', input);
  const { dataPoints, shelfLifeCriterion, storageTemp } = input;

  // The shelf life is the time to reach the criterion; a criterion ≤ 0 is reached at once, and a
  // temperature at or below absolute zero has no 1/T.
  if (!(shelfLifeCriterion > 0)) {
    throw new InputRangeError('shelfLifeCriterion must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'shelfLifeCriterion', exclusive_min: 0, got: shelfLifeCriterion,
    });
  }
  if (!(storageTemp > -273.15)) {
    throw new InputRangeError('storageTemp must be above absolute zero (-273.15 °C)', {
      code: 'parameter_out_of_range', parameter: 'storageTemp', exclusive_min: -273.15, got: storageTemp,
    });
  }
  for (const [i, dp] of dataPoints.entries()) {
    if (!(dp.temperature > -273.15)) {
      throw new RangeError(`dataPoints[${i}].temperature must be above absolute zero (-273.15 °C)`);
    }
  }

  // Group data by temperature and calculate rate constants
  const tempGroups = new Map<number, { times: number[]; degradations: number[] }>();
  for (const dp of dataPoints) {
    if (!tempGroups.has(dp.temperature)) {
      tempGroups.set(dp.temperature, { times: [], degradations: [] });
    }
    const group = tempGroups.get(dp.temperature)!;
    group.times.push(dp.time);
    group.degradations.push(dp.degradation);
  }

  // Calculate rate constant for each temperature (simple linear: degradation = k × time)
  const rateConstants: { temperature: number; rateConstant: number }[] = [];
  const lnKValues: number[] = [];
  const invTValues: number[] = [];

  for (const [temp, data] of tempGroups) {
    // Linear regression: degradation = k × time (through origin)
    const sumTD = data.times.reduce((s, t, i) => s + t * data.degradations[i], 0);
    const sumT2 = data.times.reduce((s, t) => s + t * t, 0);
    const k = sumT2 > 0 ? sumTD / sumT2 : 0;

    if (k > 0) {
      rateConstants.push({ temperature: temp, rateConstant: roundTo(k, 6) });
      lnKValues.push(Math.log(k));
      invTValues.push(1 / (temp + 273.15));
    }
  }

  // The Arrhenius line needs two temperatures with a measurable rate. With fewer there is no
  // extrapolation — the former default (Ea 0, Q10 1, shelf life 0) read as «expires at once».
  if (lnKValues.length < 2) {
    throw new RangeError(
      `degradation must rise over time at 2 or more temperatures to fit the Arrhenius line (got ${lnKValues.length})`,
    );
  }

  // Arrhenius regression: ln(k) = ln(A) - Ea/(R×T)
  // Y = ln(k), X = 1/T
  const n = lnKValues.length;
  const sumX = invTValues.reduce((s, v) => s + v, 0);
  const sumY = lnKValues.reduce((s, v) => s + v, 0);
  const sumXY = invTValues.reduce((s, v, i) => s + v * lnKValues[i], 0);
  const sumX2 = invTValues.reduce((s, v) => s + v * v, 0);
  const sumY2 = lnKValues.reduce((s, v) => s + v * v, 0);

  // Equal rates at every temperature are a flat line exactly — the least-squares arithmetic
  // would leave a rounding residue (a −0.00 kJ/mol activation energy).
  const flat = lnKValues.every((v) => v === lnKValues[0]);
  const slope = flat ? 0 : (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Ea = -slope × R (kJ/mol)
  const activationEnergy = flat ? 0 : -slope * R;

  // R²
  const yMean = sumY / n;
  const ssTot = sumY2 - n * yMean * yMean;
  const ssRes = lnKValues.reduce((s, y, i) => {
    const yPred = intercept + slope * invTValues[i];
    return s + (y - yPred) ** 2;
  }, 0);
  // Equal rates at every temperature: Ea is 0, and the fit has no variation to explain.
  const r2 = flat || !(ssTot > 0) ? null : 1 - ssRes / ssTot;

  // Rate constant at storage temperature
  const kStorage = Math.exp(intercept + slope / (storageTemp + 273.15));
  const predictedShelfLife = shelfLifeCriterion / kStorage;
  if (!Number.isFinite(predictedShelfLife)) {
    throw new RangeError('the Arrhenius extrapolation to storageTemp leaves the representable range');
  }

  // Q10: ratio of rate constants at T and T+10
  const T1 = storageTemp + 273.15;
  const T2 = T1 + 10;
  const q10 = Math.exp(activationEnergy * 10 / (R * T1 * T2));

  // Acceleration factor: highest test temp vs storage temp
  const maxTestTemp = Math.max(...Array.from(tempGroups.keys()));
  const kMaxTemp = Math.exp(intercept + slope / (maxTestTemp + 273.15));
  const accelerationFactor = kMaxTemp / kStorage;

  return {
    activationEnergy: roundTo(activationEnergy, 2),
    q10: roundTo(q10, 2),
    predictedShelfLife: roundTo(predictedShelfLife, 1),
    rateConstants,
    r2: r2 === null ? null : roundTo(r2, 4),
    accelerationFactor: roundTo(accelerationFactor, 2),
  };
}
