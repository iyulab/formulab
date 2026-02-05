import { roundTo } from '../utils.js';
import type { YieldInput, YieldResult } from './types.js';

/**
 * Calculate First Pass Yield (FPY) and Rolled Throughput Yield (RTY)
 *
 * FPY = Good Units / Total Units (per step)
 * RTY = Product of all FPY values (cumulative yield)
 *
 * @param input - Yield input parameters
 * @returns Yield analysis result
 */
export function yieldCalc(input: YieldInput): YieldResult {
  const { steps } = input;

  // Handle empty or invalid input
  if (!steps || steps.length === 0) {
    return {
      fpyPerStep: [],
      averageFpy: 0,
      rty: 0,
      totalInput: 0,
      expectedOutput: 0,
    };
  }

  // Calculate FPY for each step
  const fpyPerStep: number[] = [];
  let rtyDecimal = 1;

  for (const step of steps) {
    if (step.total <= 0) {
      fpyPerStep.push(0);
      rtyDecimal = 0;
    } else {
      const fpy = step.good / step.total;
      fpyPerStep.push(roundTo(fpy * 100, 2));
      rtyDecimal *= fpy;
    }
  }

  // Calculate average FPY
  const sumFpy = fpyPerStep.reduce((acc, val) => acc + val, 0);
  const averageFpy = fpyPerStep.length > 0 ? roundTo(sumFpy / fpyPerStep.length, 2) : 0;

  // Calculate RTY (Rolled Throughput Yield)
  const rty = roundTo(rtyDecimal * 100, 2);

  // Calculate expected output
  const totalInput = steps[0]?.total ?? 0;
  const expectedOutput = roundTo(totalInput * rtyDecimal, 0);

  return {
    fpyPerStep,
    averageFpy,
    rty,
    totalInput,
    expectedOutput,
  };
}
