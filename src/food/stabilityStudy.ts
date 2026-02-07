import { roundTo } from '../utils.js';
import type { StabilityStudyInput, StabilityStudyResult } from './types.js';

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
 */
export function stabilityStudy(input: StabilityStudyInput): StabilityStudyResult {
  const { dataPoints, shelfLifeCriterion, storageTemp } = input;

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

  if (lnKValues.length < 2) {
    return {
      activationEnergy: 0,
      q10: 1,
      predictedShelfLife: 0,
      rateConstants,
      r2: 0,
      accelerationFactor: 1,
    };
  }

  // Arrhenius regression: ln(k) = ln(A) - Ea/(R×T)
  // Y = ln(k), X = 1/T
  const n = lnKValues.length;
  const sumX = invTValues.reduce((s, v) => s + v, 0);
  const sumY = lnKValues.reduce((s, v) => s + v, 0);
  const sumXY = invTValues.reduce((s, v, i) => s + v * lnKValues[i], 0);
  const sumX2 = invTValues.reduce((s, v) => s + v * v, 0);
  const sumY2 = lnKValues.reduce((s, v) => s + v * v, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Ea = -slope × R (kJ/mol)
  const activationEnergy = -slope * R;

  // R²
  const yMean = sumY / n;
  const ssTot = sumY2 - n * yMean * yMean;
  const ssRes = lnKValues.reduce((s, y, i) => {
    const yPred = intercept + slope * invTValues[i];
    return s + (y - yPred) ** 2;
  }, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // Rate constant at storage temperature
  const kStorage = Math.exp(intercept + slope / (storageTemp + 273.15));
  const predictedShelfLife = kStorage > 0 ? shelfLifeCriterion / kStorage : 0;

  // Q10: ratio of rate constants at T and T+10
  const T1 = storageTemp + 273.15;
  const T2 = T1 + 10;
  const q10 = Math.exp(activationEnergy * 10 / (R * T1 * T2));

  // Acceleration factor: highest test temp vs storage temp
  const maxTestTemp = Math.max(...Array.from(tempGroups.keys()));
  const kMaxTemp = Math.exp(intercept + slope / (maxTestTemp + 273.15));
  const accelerationFactor = kStorage > 0 ? kMaxTemp / kStorage : 1;

  return {
    activationEnergy: roundTo(activationEnergy, 2),
    q10: roundTo(q10, 2),
    predictedShelfLife: roundTo(predictedShelfLife, 1),
    rateConstants,
    r2: roundTo(r2, 4),
    accelerationFactor: roundTo(accelerationFactor, 2),
  };
}
