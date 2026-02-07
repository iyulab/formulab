import { roundTo } from '../utils.js';
import type { WeibullInput, WeibullResult } from './types.js';

/**
 * Weibull Reliability Analysis — Median Rank Regression
 *
 * @formula
 *   - F(i) = (i − 0.3) / (n + 0.4)  (Benard's approximation for median rank)
 *   - Y = ln(ln(1/(1−F))) vs X = ln(t) → linear regression
 *   - β = slope, η = exp(−intercept/slope)
 *   - MTTF = η × Γ(1 + 1/β)
 *   - R(t) = exp(−(t/η)^β)
 *   - B10 = η × (−ln(0.9))^(1/β)
 *
 * @reference Abernethy, R.B. "The New Weibull Handbook", 5th Ed.
 * @reference IEC 61649:2008 — Weibull Analysis
 */
export function weibull(input: WeibullInput): WeibullResult {
  const { failureTimes, missionTime } = input;

  // Sort failure times ascending
  const sorted = [...failureTimes].sort((a, b) => a - b);
  const n = sorted.length;

  // Median rank regression
  const xVals: number[] = []; // ln(t)
  const yVals: number[] = []; // ln(ln(1/(1-F)))

  for (let i = 0; i < n; i++) {
    const rank = i + 1;
    const f = (rank - 0.3) / (n + 0.4); // Benard's approximation
    xVals.push(Math.log(sorted[i]));
    yVals.push(Math.log(Math.log(1 / (1 - f))));
  }

  // Linear regression: Y = a + b*X
  const sumX = xVals.reduce((s, v) => s + v, 0);
  const sumY = yVals.reduce((s, v) => s + v, 0);
  const sumXY = xVals.reduce((s, v, i) => s + v * yVals[i], 0);
  const sumX2 = xVals.reduce((s, v) => s + v * v, 0);
  const sumY2 = yVals.reduce((s, v) => s + v * v, 0);

  const beta = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - beta * sumX) / n;
  const eta = Math.exp(-intercept / beta);

  // R² (coefficient of determination)
  const yMean = sumY / n;
  const ssTot = sumY2 - n * yMean * yMean;
  const ssRes = yVals.reduce((s, y, i) => {
    const yPred = intercept + beta * xVals[i];
    return s + (y - yPred) ** 2;
  }, 0);
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // MTTF = η × Γ(1 + 1/β)
  const mttf = eta * gamma(1 + 1 / beta);

  // B10 life: 10% failure life
  const b10Life = eta * Math.pow(-Math.log(0.9), 1 / beta);

  // B50 life: Median life
  const b50Life = eta * Math.pow(-Math.log(0.5), 1 / beta);

  // Reliability at mission time
  const reliability = missionTime != null
    ? Math.exp(-Math.pow(missionTime / eta, beta))
    : null;

  // Failure mode classification
  let failureMode: WeibullResult['failureMode'];
  if (beta < 0.95) {
    failureMode = 'infant';
  } else if (beta <= 1.05) {
    failureMode = 'random';
  } else {
    failureMode = 'wearout';
  }

  return {
    beta: roundTo(beta, 4),
    eta: roundTo(eta, 2),
    mttf: roundTo(mttf, 2),
    r2: roundTo(r2, 4),
    reliability: reliability != null ? roundTo(reliability, 4) : null,
    b10Life: roundTo(b10Life, 2),
    b50Life: roundTo(b50Life, 2),
    failureMode,
  };
}

/**
 * Gamma function approximation using Lanczos method
 */
function gamma(z: number): number {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
