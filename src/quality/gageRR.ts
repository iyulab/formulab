import { roundTo } from '../utils.js';
import { fCDF } from '../math.js';
import type { GageRRInput, GageRRResult } from './types.js';

// AIAG MSA 4th Ed. — 5.15σ spans the middle 99% of a normal distribution; both methods share
// this scale so EV/AV/PV/GRR/TV (and %Tolerance) are comparable across method choice.
const SIGMA_MULTIPLIER = 5.15;

// AIAG convention: pool Operator×Part interaction into equipment error when p > 0.25.
const POOLING_P_THRESHOLD = 0.25;

// AIAG MSA 4th Ed — K1 constants by number of trials
const K1: Record<number, number> = { 2: 4.56, 3: 3.05 };

// K2 constants by number of operators
const K2: Record<number, number> = { 2: 3.65, 3: 2.70 };

// K3 constants by number of parts
const K3: Record<number, number> = {
  2: 3.65, 3: 2.70, 4: 2.30, 5: 2.08,
  6: 1.93, 7: 1.82, 8: 1.74, 9: 1.67, 10: 1.62,
};

type GageRRStatus = GageRRResult['status'];
const STATUS_RANK: Record<GageRRStatus, number> = { acceptable: 0, marginal: 1, unacceptable: 2 };

// AIAG MSA 4th Ed. applies the same ≤10/≤30 bands to %GRR-of-tolerance as to %GRR-of-TV.
function classifyPercent(percent: number): GageRRStatus {
  if (percent <= 10) return 'acceptable';
  if (percent <= 30) return 'marginal';
  return 'unacceptable';
}

function worse(a: GageRRStatus, b: GageRRStatus): GageRRStatus {
  return STATUS_RANK[a] >= STATUS_RANK[b] ? a : b;
}

// Shared %GRR / %Tolerance / ndc / status derivation — both methods produce ev/av/grr/pv/tv on
// the same 5.15σ scale, so the classification logic (and its worse-of-two-criteria rule) is
// identical regardless of which method computed them.
function classify(
  grr: number, pv: number, tv: number, tolerance: number | undefined,
): Pick<GageRRResult, 'percentGRR' | 'percentTolerance' | 'ndc' | 'status'> {
  const percentGRR = tv > 0 ? roundTo((grr / tv) * 100, 2) : 0;
  const percentTolerance = tolerance != null && tolerance > 0
    ? roundTo((grr / tolerance) * 100, 2)
    : null;
  const ndc = grr > 0 ? Math.floor(1.41 * (pv / grr)) : 0;
  const byPercentGRR = classifyPercent(percentGRR);
  const status = percentTolerance != null ? worse(byPercentGRR, classifyPercent(percentTolerance)) : byPercentGRR;
  return { percentGRR, percentTolerance, ndc, status };
}

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
function gageRRAverageRange(input: GageRRInput): GageRRResult {
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

  // %Tolerance — grr is already 5.15sigma-scaled (K1/K2/K3 = 5.15/d2*), same scale as the
  // tolerance band, so no further multiplier belongs here (matches %GRR = grr/tv x 100, which
  // has none either). %GRR-of-TV is the process-control criterion; when a tolerance is supplied,
  // %GRR-of-tolerance (product-acceptance criterion) is evaluated too and the worse of the two
  // wins, since a measurement system unfit for either purpose should not read "acceptable".
  const { percentGRR, percentTolerance, ndc, status } = classify(grr, pv, tv, tolerance);

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
    method: 'average-range',
  };
}

/**
 * Gage R&R (Measurement System Analysis) — AIAG MSA 4th Edition, ANOVA Method
 *
 * Two-factor crossed random-effects ANOVA (Part × Operator), which — unlike the Average-Range
 * method — separates the Part×Operator interaction from repeatability. When the interaction is
 * not statistically significant (F-test, p > 0.25 per AIAG convention) it is pooled into the
 * equipment (error) term; otherwise it is folded into reproducibility (AV) alongside operator
 * variance.
 *
 * @formula
 *   - SS_total = Σ(x - x̄)², df_total = n·k·r − 1
 *   - SS_part = k·r·Σ(p̄ᵢ - x̄)², df_part = n − 1
 *   - SS_operator = n·r·Σ(ōⱼ - x̄)², df_operator = k − 1
 *   - SS_interaction = SS_subgroup − SS_part − SS_operator, df_interaction = (n−1)(k−1)
 *   - SS_equipment = SS_total − SS_subgroup, df_equipment = n·k·(r−1)
 *   - F(interaction) = MS_interaction / MS_equipment; pooled when p(F) > 0.25
 *   - Pooled:     σ²_equip = MS_pooled, σ²_op = (MS_op − MS_pooled)/(n·r), σ²_part = (MS_part − MS_pooled)/(k·r)
 *   - Unpooled:   σ²_equip = MS_equipment, σ²_int = (MS_interaction − MS_equipment)/r,
 *                 σ²_op = (MS_op − MS_interaction)/(n·r), σ²_part = (MS_part − MS_interaction)/(k·r)
 *   - EV = √σ²_equip × 5.15, AV = √(σ²_op + σ²_int) × 5.15, GRR = √(EV² + AV²)
 *   - PV = √σ²_part × 5.15, TV = √(GRR² + PV²), %GRR = GRR/TV × 100, ndc = floor(1.41 × PV/GRR)
 *   (n = parts, k = operators, r = trials; all negative variance estimates floor at 0)
 *
 * @reference AIAG Measurement Systems Analysis Reference Manual, 4th Edition — ANOVA Method
 * @throws {RangeError} fewer than 2 parts, 2 operators, or 2 trials (ANOVA cannot estimate
 *   the interaction/equipment terms from a single level)
 */
function gageRRAnova(input: GageRRInput): GageRRResult {
  const { measurements, tolerance } = input;

  const numParts = measurements.length;
  const numOperators = measurements[0].length;
  const numTrials = measurements[0][0].length;

  if (numParts < 2) throw new RangeError('ANOVA method requires at least 2 parts');
  if (numOperators < 2) throw new RangeError('ANOVA method requires at least 2 operators');
  if (numTrials < 2) throw new RangeError('ANOVA method requires at least 2 trials per part-operator combination');

  let grandSum = 0;
  const totalN = numParts * numOperators * numTrials;
  for (const part of measurements) {
    for (const op of part) {
      for (const v of op) grandSum += v;
    }
  }
  const grandMean = grandSum / totalN;

  const partMeans: number[] = [];
  for (let p = 0; p < numParts; p++) {
    let sum = 0;
    for (let o = 0; o < numOperators; o++) for (let t = 0; t < numTrials; t++) sum += measurements[p][o][t];
    partMeans.push(sum / (numOperators * numTrials));
  }

  const operatorMeans: number[] = [];
  for (let o = 0; o < numOperators; o++) {
    let sum = 0;
    for (let p = 0; p < numParts; p++) for (let t = 0; t < numTrials; t++) sum += measurements[p][o][t];
    operatorMeans.push(sum / (numParts * numTrials));
  }

  let ssTotal = 0;
  let ssSubgroup = 0;
  for (let p = 0; p < numParts; p++) {
    for (let o = 0; o < numOperators; o++) {
      let cellSum = 0;
      for (let t = 0; t < numTrials; t++) {
        const v = measurements[p][o][t];
        cellSum += v;
        ssTotal += (v - grandMean) ** 2;
      }
      const cellMean = cellSum / numTrials;
      ssSubgroup += numTrials * (cellMean - grandMean) ** 2;
    }
  }

  const ssPart = numOperators * numTrials * partMeans.reduce((s, m) => s + (m - grandMean) ** 2, 0);
  const ssOperator = numParts * numTrials * operatorMeans.reduce((s, m) => s + (m - grandMean) ** 2, 0);
  const ssInteraction = ssSubgroup - ssPart - ssOperator;
  const ssEquipment = ssTotal - ssSubgroup;

  const dfPart = numParts - 1;
  const dfOperator = numOperators - 1;
  const dfInteraction = dfPart * dfOperator;
  const dfEquipment = numParts * numOperators * (numTrials - 1);

  const msPart = ssPart / dfPart;
  const msOperator = ssOperator / dfOperator;
  const msInteraction = ssInteraction / dfInteraction;
  const msEquipment = ssEquipment / dfEquipment;

  // F(interaction) — AIAG computes an F-ratio only for the interaction term.
  let fStatistic: number;
  let pValue: number;
  if (msEquipment === 0) {
    fStatistic = msInteraction === 0 ? 0 : Infinity;
    pValue = msInteraction === 0 ? 1 : 0;
  } else {
    fStatistic = msInteraction / msEquipment;
    pValue = 1 - fCDF(fStatistic, dfInteraction, dfEquipment);
  }
  const pooled = pValue > POOLING_P_THRESHOLD;

  let equipmentVariance: number;
  let interactionVariance: number;
  let operatorVariance: number;
  let partVariance: number;

  if (pooled) {
    const msPooled = (ssInteraction + ssEquipment) / (dfInteraction + dfEquipment);
    equipmentVariance = Math.max(0, msPooled);
    interactionVariance = 0;
    operatorVariance = Math.max(0, (msOperator - msPooled) / (numParts * numTrials));
    partVariance = Math.max(0, (msPart - msPooled) / (numOperators * numTrials));
  } else {
    // ssEquipment (= within-cell SS) is a sum of squares and mathematically >= 0; a tiny
    // negative here is floating-point noise, not a real estimate — clamp defensively.
    equipmentVariance = Math.max(0, msEquipment);
    interactionVariance = Math.max(0, (msInteraction - msEquipment) / numTrials);
    operatorVariance = Math.max(0, (msOperator - msInteraction) / (numParts * numTrials));
    partVariance = Math.max(0, (msPart - msInteraction) / (numOperators * numTrials));
  }

  const ev = Math.sqrt(equipmentVariance) * SIGMA_MULTIPLIER;
  const av = Math.sqrt(operatorVariance + interactionVariance) * SIGMA_MULTIPLIER;
  const grr = Math.sqrt(ev ** 2 + av ** 2);
  const pv = Math.sqrt(partVariance) * SIGMA_MULTIPLIER;
  const tv = Math.sqrt(grr ** 2 + pv ** 2);

  const { percentGRR, percentTolerance, ndc, status } = classify(grr, pv, tv, tolerance);

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
    method: 'anova',
    interaction: {
      variance: roundTo(interactionVariance, 6),
      fStatistic: roundTo(fStatistic, 3),
      pValue: roundTo(pValue, 4),
      pooled,
    },
  };
}

/**
 * Gage R&R (Measurement System Analysis) — AIAG MSA 4th Edition.
 *
 * Dispatches to the Average-Range method (default) or the ANOVA method per `input.method`.
 * See {@link gageRRAverageRange} and {@link gageRRAnova} for the method-specific formulas.
 */
export function gageRR(input: GageRRInput): GageRRResult {
  return input.method === 'anova' ? gageRRAnova(input) : gageRRAverageRange(input);
}
