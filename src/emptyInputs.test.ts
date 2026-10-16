import { describe, it, expect } from 'vitest';
import { cusum, degreeDay } from './energy/index.js';
import { productCarbonFootprint } from './environmental/index.js';
import { vaAnalysis } from './ie/index.js';
import { abcAnalysis, pallet3d, tsp } from './logistics/index.js';
import { nelsonRules, paretoAnalysis, yieldCalc } from './quality/index.js';
import { histogram, movingAverage, normalize, npv, percentile, statistics, bilinearInterpolation } from './utility/index.js';

/** The code and parameter a refusal carries (non-enumerable, like `message`). */
function refusal(fn: () => unknown): { code?: unknown; parameter?: unknown; min?: unknown; got?: unknown } {
  try {
    fn();
  } catch (e) {
    const r = e as Record<string, unknown>;
    expect(e).toBeInstanceOf(RangeError);
    return { code: r.code, parameter: r.parameter, min: r.min, got: r.got };
  }
  throw new Error('expected a refusal');
}

// An empty list the caller gave is refused as `empty_input`, naming the list — a consumer
// translates it and points at the input instead of showing the English sentence.
describe('empty input lists are refused with a code', () => {
  const cases: Array<[string, () => unknown, string]> = [
    ['cusum', () => cusum({ values: [], target: 10 }), 'values'],
    ['degreeDay', () => degreeDay({ dailyTemps: [] }), 'dailyTemps'],
    ['productCarbonFootprint', () => productCarbonFootprint({ stages: [], productionQuantity: 10 }), 'stages'],
    ['vaAnalysis', () => vaAnalysis({ activities: [] }), 'activities'],
    ['abcAnalysis', () => abcAnalysis({ items: [] }), 'items'],
    ['pallet3d', () => pallet3d({ pallet: { length: 1200, width: 1000, maxHeight: 1500, maxWeight: 1000 }, boxes: [] } as never), 'boxes'],
    ['tsp', () => tsp({ nodes: [] }), 'nodes'],
    ['nelsonRules', () => nelsonRules({ values: [], centerLine: 10, sigma: 1 }), 'values'],
    ['paretoAnalysis', () => paretoAnalysis({ items: [] }), 'items'],
    ['yieldCalc', () => yieldCalc({ steps: [] }), 'steps'],
    ['histogram', () => histogram({ data: [] }), 'data'],
    ['movingAverage', () => movingAverage({ data: [], window: 3, method: 'sma' }), 'data'],
    ['normalize', () => normalize({ data: [], method: 'min-max' }), 'data'],
    ['npv', () => npv({ cashFlows: [], discountRate: 0.1 } as never), 'cashFlows'],
    ['percentile', () => percentile({ data: [], percentile: 50 }), 'data'],
    ['statistics', () => statistics({ data: [] }), 'data'],
  ];
  for (const [name, fn, parameter] of cases) {
    it(name, () => {
      expect(refusal(fn)).toMatchObject({ code: 'empty_input', parameter });
    });
  }

  it('bilinearInterpolation needs two grid points per axis (insufficient_data)', () => {
    expect(refusal(() => bilinearInterpolation({ x: [1], y: [1, 2], z: [[1, 2]], targetX: 1, targetY: 1 } as never)))
      .toMatchObject({ code: 'insufficient_data', parameter: 'x', min: 2, got: 1 });
  });
});
