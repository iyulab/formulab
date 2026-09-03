import { roundTo } from '../utils.js';
import { XBAR_R_CONSTANTS } from './controlChart.js';
import type {
  ControlLimit,
  MovingAverageRangeChartInput,
  MovingAverageRangeChartResult,
  MovingWindowStat,
} from './types.js';

function mean(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/**
 * Moving Average / Moving Range Chart.
 *
 * For processes where destructive testing or a slow production rate makes
 * fixed-size subgroups impractical, individual measurements are instead
 * monitored through a sliding window of size k: each point's moving average
 * and moving range are computed from the k most recent observations, reusing
 * the same X-bar/R Annex A factors (A2/D3/D4) with the window size k taking
 * the place of subgroup size n.
 *
 * @formula
 *   - Moving average: MA_i = mean(x_{i-k+1}, ..., x_i)
 *   - Moving range:   MR_i = max(x_{i-k+1}, ..., x_i) - min(x_{i-k+1}, ..., x_i)
 *   - CL_MA = mean(MA_i),  UCL_MA = CL_MA + A2·MR̄,  LCL_MA = CL_MA − A2·MR̄
 *   - CL_MR = MR̄,          UCL_MR = D4·MR̄,          LCL_MR = max(0, D3·MR̄)
 *   - σ̂ = MR̄ / d2
 *
 * @reference ISO 7870-5:2014, Clause 6 (Moving average and moving range control
 *   charts). The Clause 6.5 worked example (watchcase crown pin hole diameter,
 *   n=25 individuals, k=3) is reproduced as a golden test - recomputed directly
 *   from the standard's Table 1 raw diameter values rather than its printed
 *   summary/formula lines, which carry table-cell transcription risk in some
 *   digitized copies of the standard.
 * @reference Shares the Annex A (= ISO 7870-2:2023, Table 2) factor table with
 *   X-bar/R - see XBAR_R_CONSTANTS in controlChart.ts (single source of truth,
 *   not duplicated here).
 *
 * @throws {RangeError} windowSize must be between 2 and 25
 * @throws {RangeError} At least windowSize + 1 values are required (need at
 *   least 2 moving windows to estimate control limits)
 * @param input - individual measurements and window size k
 * @returns moving average / moving range control limits, per-point stats, out-of-control points
 */
export function movingAverageRangeChart(
  input: MovingAverageRangeChartInput,
): MovingAverageRangeChartResult {
  const { values, windowSize: k } = input;

  if (k < 2 || k > 25) {
    throw new RangeError('windowSize must be between 2 and 25');
  }
  if (values.length < k + 1) {
    throw new RangeError(`At least ${k + 1} values are required for windowSize ${k}`);
  }

  const constants = XBAR_R_CONSTANTS[k];

  const movingAverages: number[] = [];
  const movingRanges: number[] = [];
  for (let i = k - 1; i < values.length; i++) {
    const window = values.slice(i - k + 1, i + 1);
    movingAverages.push(mean(window));
    movingRanges.push(Math.max(...window) - Math.min(...window));
  }

  const maBar = mean(movingAverages);
  const mrBar = mean(movingRanges);
  const sigmaEstimate = mrBar / constants.d2;

  const maLimits: ControlLimit = {
    centerLine: roundTo(maBar, 4),
    ucl: roundTo(maBar + constants.A2 * mrBar, 4),
    lcl: roundTo(maBar - constants.A2 * mrBar, 4),
  };

  const mrLimits: ControlLimit = {
    centerLine: roundTo(mrBar, 4),
    ucl: roundTo(constants.D4 * mrBar, 4),
    lcl: roundTo(Math.max(0, constants.D3 * mrBar), 4),
  };

  const outOfControlPoints: number[] = [];
  const windowStats: MovingWindowStat[] = values.map((_v, i) => {
    if (i < k - 1) {
      return { index: i, outOfControl: false };
    }
    const j = i - (k - 1);
    const ma = movingAverages[j];
    const mr = movingRanges[j];
    const ooc = ma < maLimits.lcl || ma > maLimits.ucl
      || mr > mrLimits.ucl || (mrLimits.lcl > 0 && mr < mrLimits.lcl);
    if (ooc) outOfControlPoints.push(i);
    return {
      index: i,
      movingAverage: roundTo(ma, 4),
      movingRange: roundTo(mr, 4),
      outOfControl: ooc,
    };
  });

  return {
    windowSize: k,
    maLimits,
    mrLimits,
    windowStats,
    grandAverage: roundTo(maBar, 4),
    sigmaEstimate: roundTo(sigmaEstimate, 4),
    outOfControlPoints,
    processCapable: outOfControlPoints.length === 0,
  };
}
