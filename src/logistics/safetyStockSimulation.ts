import { roundTo, requireFinite } from '../utils.js';
import { histogram } from '../utility/histogram.js';
import type { SafetyStockSimulationInput, SafetyStockSimulationResult } from './types.js';
import { inputRangeError } from '../errors.js';

/** Mulberry32 — a small seeded generator, so the same input gives the same simulation. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller normal variate. */
function normalSample(rand: () => number, mean: number, stdDev: number): number {
  const u1 = rand() || Number.MIN_VALUE; // log(0) has no value
  const u2 = rand();
  return mean + stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Knuth's Poisson variate (fine for daily demand; cost grows with λ). */
function poissonSample(rand: () => number, lambda: number): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > limit);
  return k - 1;
}

/**
 * Safety stock and reorder point by Monte Carlo simulation of demand during lead time — the
 * empirical counterpart of `safetyStock()`, which assumes that demand is normally distributed.
 *
 * Each trial draws a lead time ~ N(avgLeadTime, leadTimeStdDev) (at least 0.1 day) and sums the
 * demand over it, one draw per whole day plus one for the part-day — N(avgDemand·f,
 * demandStdDev·√f) floored at 0, or Poisson(avgDemand·f), for a span of f days. With no variability
 * the demand during lead time is exactly avgDemand × avgLeadTime. The reorder point is the trials' `serviceLevel` quantile; safety stock is that
 * quantile minus their mean.
 *
 * @formula ROP = quantile_SL(DDLT samples); SS = ROP − mean(DDLT samples)
 *
 * @units demand: units/day · lead time: days · output: units
 *
 * @param input - `safetyStock()`'s input plus the demand distribution, trial count and seed
 * @returns Simulated safety stock and reorder point, the service level the reorder point achieves
 *   among the trials, and the distribution of demand during lead time
 * @throws {RangeError} serviceLevel is not strictly between 0 and 1, avgDemand or avgLeadTime is not
 *   greater than 0, a standard deviation is negative, iterations is not a whole number from 100 to
 *   100,000, or bins is not a whole number of at least 1
 */
export function safetyStockSimulation(input: SafetyStockSimulationInput): SafetyStockSimulationResult {
  requireFinite('safetyStockSimulation', input);
  const {
    avgDemand, demandStdDev, avgLeadTime, leadTimeStdDev, serviceLevel,
    demandDistribution = 'normal', iterations = 10000, seed = 42, bins = 20,
  } = input;

  if (!(serviceLevel > 0) || serviceLevel >= 1) {
    throw inputRangeError('serviceLevel must be greater than 0 and less than 1', {
      code: 'parameter_out_of_range', parameter: 'serviceLevel', exclusive_min: 0, exclusive_max: 1, got: serviceLevel,
    });
  }
  if (!(avgDemand > 0)) {
    throw inputRangeError('avgDemand must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'avgDemand', exclusive_min: 0, got: avgDemand,
    });
  }
  if (!(avgLeadTime > 0)) {
    throw inputRangeError('avgLeadTime must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'avgLeadTime', exclusive_min: 0, got: avgLeadTime,
    });
  }
  if (!(demandStdDev >= 0)) {
    throw inputRangeError('demandStdDev must not be negative', {
      code: 'parameter_out_of_range', parameter: 'demandStdDev', min: 0, got: demandStdDev,
    });
  }
  if (!(leadTimeStdDev >= 0)) {
    throw inputRangeError('leadTimeStdDev must not be negative', {
      code: 'parameter_out_of_range', parameter: 'leadTimeStdDev', min: 0, got: leadTimeStdDev,
    });
  }
  if (!Number.isInteger(iterations) || iterations < 100 || iterations > 100_000) {
    throw inputRangeError('iterations must be a whole number from 100 to 100000', {
      code: 'parameter_out_of_range', parameter: 'iterations', min: 100, max: 100_000, got: iterations,
    });
  }
  if (!Number.isInteger(bins) || bins < 1) {
    throw inputRangeError('bins must be a whole number of at least 1', {
      code: 'parameter_out_of_range', parameter: 'bins', min: 1, got: bins,
    });
  }
  if (demandDistribution !== 'normal' && demandDistribution !== 'poisson') {
    throw inputRangeError(`unknown demand distribution: ${String(demandDistribution)}`, {
      code: 'unknown_option', parameter: 'demandDistribution', got: String(demandDistribution),
    });
  }

  const rand = mulberry32(seed);
  const samples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const leadTime = Math.max(0.1, normalSample(rand, avgLeadTime, leadTimeStdDev));
    const days = Math.floor(leadTime);
    let total = 0;
    // Whole days, then the part-day: demand over a span of f days is Poisson(λf) or N(μf, σ√f).
    for (const span of [...Array<number>(days).fill(1), leadTime - days]) {
      if (span === 0) continue;
      total += demandDistribution === 'poisson'
        ? poissonSample(rand, avgDemand * span)
        : Math.max(0, normalSample(rand, avgDemand * span, demandStdDev * Math.sqrt(span)));
    }
    samples.push(total);
  }
  samples.sort((a, b) => a - b);

  const mean = samples.reduce((s, v) => s + v, 0) / iterations;
  const stdDev = Math.sqrt(samples.reduce((s, v) => s + (v - mean) ** 2, 0) / iterations);
  const reorderPoint = samples[Math.min(Math.floor(serviceLevel * iterations), iterations - 1)];
  // Ties at the quantile count as covered, so the achieved level can exceed the target.
  let covered = 0;
  while (covered < iterations && samples[covered] <= reorderPoint) covered++;
  const achievedServiceLevel = covered / iterations;

  return {
    safetyStock: roundTo(reorderPoint - mean, 0),
    reorderPoint: roundTo(reorderPoint, 0),
    meanDemandDuringLeadTime: roundTo(mean, 0),
    stdDevDemandDuringLeadTime: roundTo(stdDev, 2),
    achievedServiceLevel: roundTo(achievedServiceLevel, 4),
    stockoutProbability: roundTo(1 - achievedServiceLevel, 4),
    histogram: histogram({ data: samples, bins }).bins,
  };
}
