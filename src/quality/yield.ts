import { roundTo } from '../utils.js';
import { multiplicativeCascade } from '../math.js';
import type { YieldInput, YieldResult } from './types.js';

/**
 * Calculate First Pass Yield (FPY) and Rolled Throughput Yield (RTY)
 *
 * FPY = Good Units / Total Units (per step)
 * RTY = Product of all FPY values (cumulative yield)
 *
 * @param input - Yield input parameters
 * @returns Yield analysis result, with `cascade` — 100 % reduced by each step's FPY in step
 *   order (unrounded; the last step's `remaining` is RTY)
 * @throws {RangeError} no steps; a step with total ≤ 0, good < 0, or good > total
 */
export function yieldCalc(input: YieldInput): YieldResult {
  const { steps } = input;

  if (!steps || steps.length === 0) {
    throw new RangeError('steps must contain at least one process step');
  }
  steps.forEach((step, i) => {
    if (step.total <= 0) {
      throw new RangeError(`step ${i + 1}: total (${step.total}) must be positive`);
    }
    if (step.good < 0 || step.good > step.total) {
      throw new RangeError(`step ${i + 1}: good (${step.good}) must be between 0 and total (${step.total})`);
    }
  });

  const fpyDecimals = steps.map((step) => step.good / step.total);
  const fpyPerStep = fpyDecimals.map((fpy) => roundTo(fpy * 100, 2));

  const cascade = multiplicativeCascade(
    100,
    fpyDecimals.map((multiplier, i) => ({ factor: i, multiplier })),
  );
  const rtyDecimal = cascade[cascade.length - 1].remaining / 100;

  const sumFpy = fpyPerStep.reduce((acc, val) => acc + val, 0);
  const averageFpy = roundTo(sumFpy / fpyPerStep.length, 2);

  const rty = roundTo(rtyDecimal * 100, 2);

  const totalInput = steps[0].total;
  const expectedOutput = roundTo(totalInput * rtyDecimal, 0);

  return {
    fpyPerStep,
    averageFpy,
    rty,
    totalInput,
    expectedOutput,
    cascade,
  };
}
