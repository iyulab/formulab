import { roundTo } from '../utils.js';
import type { ControlChartInput, ControlChartResult, ControlLimit, SubgroupStat } from './types.js';

/**
 * SPC Control Chart Constants (AIAG SPC Reference Manual / ASTM E2587-16)
 * Cross-referenced: MIT 2.810, Bessegato reference table, Quality America
 *
 * Keyed by subgroup size n (2..25)
 */
const XBAR_R_CONSTANTS: Record<number, { A2: number; D3: number; D4: number; d2: number }> = {
  2:  { A2: 1.880, D3: 0,     D4: 3.267, d2: 1.128 },
  3:  { A2: 1.023, D3: 0,     D4: 2.574, d2: 1.693 },
  4:  { A2: 0.729, D3: 0,     D4: 2.282, d2: 2.059 },
  5:  { A2: 0.577, D3: 0,     D4: 2.114, d2: 2.326 },
  6:  { A2: 0.483, D3: 0,     D4: 2.004, d2: 2.534 },
  7:  { A2: 0.419, D3: 0.076, D4: 1.924, d2: 2.704 },
  8:  { A2: 0.373, D3: 0.136, D4: 1.864, d2: 2.847 },
  9:  { A2: 0.337, D3: 0.184, D4: 1.816, d2: 2.970 },
  10: { A2: 0.308, D3: 0.223, D4: 1.777, d2: 3.078 },
  11: { A2: 0.285, D3: 0.256, D4: 1.744, d2: 3.173 },
  12: { A2: 0.266, D3: 0.283, D4: 1.717, d2: 3.258 },
  13: { A2: 0.249, D3: 0.307, D4: 1.693, d2: 3.336 },
  14: { A2: 0.235, D3: 0.328, D4: 1.672, d2: 3.407 },
  15: { A2: 0.223, D3: 0.347, D4: 1.653, d2: 3.472 },
  16: { A2: 0.212, D3: 0.363, D4: 1.637, d2: 3.532 },
  17: { A2: 0.203, D3: 0.378, D4: 1.622, d2: 3.588 },
  18: { A2: 0.194, D3: 0.391, D4: 1.608, d2: 3.640 },
  19: { A2: 0.187, D3: 0.403, D4: 1.597, d2: 3.689 },
  20: { A2: 0.180, D3: 0.415, D4: 1.585, d2: 3.735 },
  21: { A2: 0.173, D3: 0.425, D4: 1.575, d2: 3.778 },
  22: { A2: 0.167, D3: 0.434, D4: 1.566, d2: 3.819 },
  23: { A2: 0.162, D3: 0.443, D4: 1.557, d2: 3.858 },
  24: { A2: 0.157, D3: 0.451, D4: 1.548, d2: 3.895 },
  25: { A2: 0.153, D3: 0.459, D4: 1.541, d2: 3.931 },
};

const XBAR_S_CONSTANTS: Record<number, { A3: number; B3: number; B4: number; c4: number }> = {
  2:  { A3: 2.659, B3: 0,     B4: 3.267, c4: 0.7979 },
  3:  { A3: 1.954, B3: 0,     B4: 2.568, c4: 0.8862 },
  4:  { A3: 1.628, B3: 0,     B4: 2.266, c4: 0.9213 },
  5:  { A3: 1.427, B3: 0,     B4: 2.089, c4: 0.9400 },
  6:  { A3: 1.287, B3: 0.030, B4: 1.970, c4: 0.9515 },
  7:  { A3: 1.182, B3: 0.118, B4: 1.882, c4: 0.9594 },
  8:  { A3: 1.099, B3: 0.185, B4: 1.815, c4: 0.9650 },
  9:  { A3: 1.032, B3: 0.239, B4: 1.761, c4: 0.9693 },
  10: { A3: 0.975, B3: 0.284, B4: 1.716, c4: 0.9727 },
  11: { A3: 0.927, B3: 0.321, B4: 1.679, c4: 0.9754 },
  12: { A3: 0.886, B3: 0.354, B4: 1.646, c4: 0.9776 },
  13: { A3: 0.850, B3: 0.382, B4: 1.618, c4: 0.9794 },
  14: { A3: 0.817, B3: 0.406, B4: 1.594, c4: 0.9810 },
  15: { A3: 0.789, B3: 0.428, B4: 1.572, c4: 0.9823 },
  16: { A3: 0.763, B3: 0.448, B4: 1.552, c4: 0.9835 },
  17: { A3: 0.739, B3: 0.466, B4: 1.534, c4: 0.9845 },
  18: { A3: 0.718, B3: 0.482, B4: 1.518, c4: 0.9854 },
  19: { A3: 0.698, B3: 0.497, B4: 1.503, c4: 0.9862 },
  20: { A3: 0.680, B3: 0.510, B4: 1.490, c4: 0.9869 },
  21: { A3: 0.663, B3: 0.523, B4: 1.477, c4: 0.9876 },
  22: { A3: 0.647, B3: 0.534, B4: 1.466, c4: 0.9882 },
  23: { A3: 0.633, B3: 0.545, B4: 1.455, c4: 0.9887 },
  24: { A3: 0.619, B3: 0.555, B4: 1.445, c4: 0.9892 },
  25: { A3: 0.606, B3: 0.565, B4: 1.435, c4: 0.9896 },
};

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function range(arr: number[]): number {
  return Math.max(...arr) - Math.min(...arr);
}

function stdDev(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) * (v - m), 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/**
 * SPC Control Chart Calculator (X-bar/R and X-bar/S)
 *
 * Builds control chart with limits from subgroup data.
 * Supports subgroup sizes 2-25 per AIAG/ASTM E2587.
 *
 * X-bar/R: Uses range to estimate σ (best for n ≤ 10)
 * X-bar/S: Uses standard deviation to estimate σ (better for n > 10)
 *
 * @param input - chart type and subgroup data
 * @returns control limits, subgroup statistics, out-of-control points
 */
export function controlChart(input: ControlChartInput): ControlChartResult {
  const { chartType, subgroups } = input;

  if (subgroups.length < 2) {
    throw new Error('At least 2 subgroups are required');
  }

  const n = subgroups[0].length;
  if (n < 2 || n > 25) {
    throw new Error('Subgroup size must be between 2 and 25');
  }

  // Validate consistent subgroup size
  for (let i = 0; i < subgroups.length; i++) {
    if (subgroups[i].length !== n) {
      throw new Error(`Subgroup ${i + 1} has size ${subgroups[i].length}, expected ${n}`);
    }
  }

  if (chartType === 'xbarR') {
    return calcXbarR(subgroups, n);
  } else {
    return calcXbarS(subgroups, n);
  }
}

function calcXbarR(subgroups: number[][], n: number): ControlChartResult {
  const constants = XBAR_R_CONSTANTS[n];

  // Calculate subgroup statistics
  const subgroupMeans = subgroups.map(sg => mean(sg));
  const subgroupRanges = subgroups.map(sg => range(sg));

  // Grand mean and average range
  const grandMean = mean(subgroupMeans);
  const rBar = mean(subgroupRanges);

  // Sigma estimate: σ̂ = R̄ / d₂
  const sigmaEstimate = rBar / constants.d2;

  // X-bar control limits
  const xBarLimits: ControlLimit = {
    centerLine: roundTo(grandMean, 4),
    ucl: roundTo(grandMean + constants.A2 * rBar, 4),
    lcl: roundTo(grandMean - constants.A2 * rBar, 4),
  };

  // R chart control limits
  const rLimits: ControlLimit = {
    centerLine: roundTo(rBar, 4),
    ucl: roundTo(constants.D4 * rBar, 4),
    lcl: roundTo(Math.max(0, constants.D3 * rBar), 4),
  };

  // Subgroup stats and out-of-control detection
  const outOfControlPoints: number[] = [];
  const subgroupStats: SubgroupStat[] = subgroups.map((_sg, i) => {
    const sgMean = subgroupMeans[i];
    const sgRange = subgroupRanges[i];
    const ooc = sgMean < xBarLimits.lcl || sgMean > xBarLimits.ucl
      || sgRange > rLimits.ucl || (rLimits.lcl > 0 && sgRange < rLimits.lcl);
    if (ooc) outOfControlPoints.push(i);
    return {
      index: i,
      mean: roundTo(sgMean, 4),
      range: roundTo(sgRange, 4),
      outOfControl: ooc,
    };
  });

  return {
    chartType: 'xbarR',
    subgroupSize: n,
    xBarLimits,
    rOrSLimits: rLimits,
    subgroupStats,
    grandMean: roundTo(grandMean, 4),
    sigmaEstimate: roundTo(sigmaEstimate, 4),
    outOfControlPoints,
    processCapable: outOfControlPoints.length === 0,
  };
}

function calcXbarS(subgroups: number[][], n: number): ControlChartResult {
  const constants = XBAR_S_CONSTANTS[n];

  // Calculate subgroup statistics
  const subgroupMeans = subgroups.map(sg => mean(sg));
  const subgroupStdDevs = subgroups.map(sg => stdDev(sg));

  // Grand mean and average std dev
  const grandMean = mean(subgroupMeans);
  const sBar = mean(subgroupStdDevs);

  // Sigma estimate: σ̂ = S̄ / c₄
  const sigmaEstimate = sBar / constants.c4;

  // X-bar control limits
  const xBarLimits: ControlLimit = {
    centerLine: roundTo(grandMean, 4),
    ucl: roundTo(grandMean + constants.A3 * sBar, 4),
    lcl: roundTo(grandMean - constants.A3 * sBar, 4),
  };

  // S chart control limits
  const sLimits: ControlLimit = {
    centerLine: roundTo(sBar, 4),
    ucl: roundTo(constants.B4 * sBar, 4),
    lcl: roundTo(Math.max(0, constants.B3 * sBar), 4),
  };

  // Subgroup stats and out-of-control detection
  const outOfControlPoints: number[] = [];
  const subgroupStats: SubgroupStat[] = subgroups.map((_sg, i) => {
    const sgMean = subgroupMeans[i];
    const sgStdDev = subgroupStdDevs[i];
    const ooc = sgMean < xBarLimits.lcl || sgMean > xBarLimits.ucl
      || sgStdDev > sLimits.ucl || (sLimits.lcl > 0 && sgStdDev < sLimits.lcl);
    if (ooc) outOfControlPoints.push(i);
    return {
      index: i,
      mean: roundTo(sgMean, 4),
      stdDev: roundTo(sgStdDev, 4),
      outOfControl: ooc,
    };
  });

  return {
    chartType: 'xbarS',
    subgroupSize: n,
    xBarLimits,
    rOrSLimits: sLimits,
    subgroupStats,
    grandMean: roundTo(grandMean, 4),
    sigmaEstimate: roundTo(sigmaEstimate, 4),
    outOfControlPoints,
    processCapable: outOfControlPoints.length === 0,
  };
}
