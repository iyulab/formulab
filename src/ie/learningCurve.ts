import { roundTo } from '../utils.js';
import type { LearningCurveInput, LearningCurveResult } from './types.js';

/**
 * Learning Curve (Wright's Law)
 *
 * @formula
 *   b = ln(learningRate) / ln(2)
 *   Unit model:       unitTime = firstUnitTime × unitNumber^b
 *   Cumulative model: cumulativeAverageTime = firstUnitTime × unitNumber^b
 *   cumulativeTotalTime = cumulativeAverageTime × unitNumber
 *
 * @reference Wright, T.P. (1936). "Factors Affecting the Cost of Airplanes".
 *            Journal of the Aeronautical Sciences, 3(4), 122-128.
 *
 * @throws {RangeError} First unit time must be a positive number
 * @throws {RangeError} Learning rate must be between 0 and 1 (exclusive)
 * @throws {RangeError} Unit number must be a positive integer
 */
export function learningCurve(input: LearningCurveInput): LearningCurveResult {
  const { firstUnitTime, learningRate, unitNumber, model = 'unit' } = input;

  if (!Number.isFinite(firstUnitTime) || firstUnitTime <= 0) {
    throw new RangeError('First unit time must be a positive number');
  }
  if (!Number.isFinite(learningRate) || learningRate <= 0 || learningRate >= 1) {
    throw new RangeError('Learning rate must be between 0 and 1 (exclusive)');
  }
  if (!Number.isFinite(unitNumber) || unitNumber < 1 || !Number.isInteger(unitNumber)) {
    throw new RangeError('Unit number must be a positive integer');
  }

  const b = Math.log(learningRate) / Math.log(2);

  let unitTime: number;
  let cumulativeAverageTime: number;
  let cumulativeTotalTime: number;

  if (model === 'cumulative') {
    // Cumulative average model: T̄(n) = T1 × n^b
    cumulativeAverageTime = firstUnitTime * Math.pow(unitNumber, b);
    cumulativeTotalTime = cumulativeAverageTime * unitNumber;
    // Individual unit time: T(n) = cumTotal(n) - cumTotal(n-1)
    if (unitNumber === 1) {
      unitTime = firstUnitTime;
    } else {
      const prevCumAvg = firstUnitTime * Math.pow(unitNumber - 1, b);
      const prevCumTotal = prevCumAvg * (unitNumber - 1);
      unitTime = cumulativeTotalTime - prevCumTotal;
    }
  } else {
    // Unit model: T(n) = T1 × n^b gives the nth unit time directly
    unitTime = firstUnitTime * Math.pow(unitNumber, b);
    // Approximate cumulative average by summing individual unit times
    let cumTotal = 0;
    for (let i = 1; i <= unitNumber; i++) {
      cumTotal += firstUnitTime * Math.pow(i, b);
    }
    cumulativeTotalTime = cumTotal;
    cumulativeAverageTime = cumTotal / unitNumber;
  }

  return {
    unitTime: roundTo(unitTime, 4),
    cumulativeAverageTime: roundTo(cumulativeAverageTime, 4),
    cumulativeTotalTime: roundTo(cumulativeTotalTime, 4),
    learningExponent: roundTo(b, 6),
  };
}
