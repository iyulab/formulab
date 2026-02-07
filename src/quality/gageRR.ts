import { roundTo } from '../utils.js';
import type { GageRRInput, GageRRResult } from './types.js';

// AIAG MSA 4th Ed — K1 constants by number of trials
const K1: Record<number, number> = { 2: 4.56, 3: 3.05 };

// K2 constants by number of operators
const K2: Record<number, number> = { 2: 3.65, 3: 2.70 };

// K3 constants by number of parts
const K3: Record<number, number> = {
  2: 3.65, 3: 2.70, 4: 2.30, 5: 2.08,
  6: 1.93, 7: 1.82, 8: 1.74, 9: 1.67, 10: 1.62,
};

/**
 * Gage R&R (Measurement System Analysis) — AIAG MSA 4th Edition, Average and Range Method
 *
 * @formula
 *   - EV = R̄ × K1
 *   - AV = √((X̄_diff × K2)² − (EV² / (n×r)))  (floored at 0)
 *   - GRR = √(EV² + AV²)
 *   - PV = Rp × K3
 *   - TV = √(GRR² + PV²)
 *   - %GRR = GRR/TV × 100
 *   - ndc = floor(1.41 × PV/GRR)
 *
 * @reference AIAG Measurement Systems Analysis Reference Manual, 4th Edition
 * @reference IATF 16949:2016 Section 7.1.5.1.1
 */
export function gageRR(input: GageRRInput): GageRRResult {
  const { measurements, tolerance } = input;

  const numParts = measurements.length;
  const numOperators = measurements[0].length;
  const numTrials = measurements[0][0].length;

  const k1 = K1[numTrials] ?? K1[3];
  const k2 = K2[numOperators] ?? K2[3];
  const k3 = K3[numParts] ?? K3[10];

  // Compute range per part per operator, then overall R̄
  let rangeSum = 0;
  for (let p = 0; p < numParts; p++) {
    for (let o = 0; o < numOperators; o++) {
      const trials = measurements[p][o];
      const maxVal = Math.max(...trials);
      const minVal = Math.min(...trials);
      rangeSum += maxVal - minVal;
    }
  }
  const rBar = rangeSum / (numParts * numOperators);

  // EV (Equipment Variation / Repeatability)
  const ev = rBar * k1;

  // Operator means
  const operatorMeans: number[] = [];
  for (let o = 0; o < numOperators; o++) {
    let sum = 0;
    for (let p = 0; p < numParts; p++) {
      for (let t = 0; t < numTrials; t++) {
        sum += measurements[p][o][t];
      }
    }
    operatorMeans.push(sum / (numParts * numTrials));
  }
  const xBarDiff = Math.max(...operatorMeans) - Math.min(...operatorMeans);

  // AV (Appraiser Variation / Reproducibility)
  const avSquared = (xBarDiff * k2) ** 2 - (ev ** 2) / (numParts * numTrials);
  const av = avSquared > 0 ? Math.sqrt(avSquared) : 0;

  // GRR
  const grr = Math.sqrt(ev ** 2 + av ** 2);

  // Part means for PV
  const partMeans: number[] = [];
  for (let p = 0; p < numParts; p++) {
    let sum = 0;
    for (let o = 0; o < numOperators; o++) {
      for (let t = 0; t < numTrials; t++) {
        sum += measurements[p][o][t];
      }
    }
    partMeans.push(sum / (numOperators * numTrials));
  }
  const rp = Math.max(...partMeans) - Math.min(...partMeans);
  const pv = rp * k3;

  // TV (Total Variation)
  const tv = Math.sqrt(grr ** 2 + pv ** 2);

  // %GRR
  const percentGRR = tv > 0 ? roundTo((grr / tv) * 100, 2) : 0;

  // %Tolerance
  const percentTolerance = tolerance != null && tolerance > 0
    ? roundTo((grr / tolerance) * 100 * 6, 2)
    : null;

  // ndc
  const ndc = grr > 0 ? Math.floor(1.41 * (pv / grr)) : 0;

  // Status
  let status: GageRRResult['status'];
  if (percentGRR <= 10) {
    status = 'acceptable';
  } else if (percentGRR <= 30) {
    status = 'marginal';
  } else {
    status = 'unacceptable';
  }

  return {
    ev: roundTo(ev, 4),
    av: roundTo(av, 4),
    grr: roundTo(grr, 4),
    pv: roundTo(pv, 4),
    tv: roundTo(tv, 4),
    percentGRR,
    percentTolerance,
    ndc,
    status,
  };
}
