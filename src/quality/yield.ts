import { roundTo, requireFinite } from '../utils.js';
import { multiplicativeCascade } from '../math.js';
import type { YieldInput, YieldResult } from './types.js';
import { inputRangeError } from '../errors.js';

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
  requireFinite('yieldCalc', input);
  const { steps } = input;

  if (!steps || steps.length === 0) {
    throw inputRangeError('steps must contain at least one process step', { code: 'empty_input', parameter: 'steps' });
  }
  steps.forEach((step, i) => {
    if (!(step.total > 0)) {
      throw inputRangeError(`step ${i + 1}: total (${step.total}) must be positive`, {
        code: 'parameter_out_of_range', parameter: 'step.total', exclusive_min: 0, got: step.total,
      });
    }
    if (!(step.good >= 0 && step.good <= step.total)) {
      throw inputRangeError(`step ${i + 1}: good (${step.good}) must be between 0 and total (${step.total})`, {
        code: 'parameter_out_of_range', parameter: 'step.good', min: 0, max: step.total, got: step.good,
      });
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
