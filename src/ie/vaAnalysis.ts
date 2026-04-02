import { roundTo } from '../utils.js';
import type { VaAnalysisInput, VaAnalysisResult, CategorySummary } from './types.js';

/**
 * Value-Added / Non-Value-Added Analysis
 *
 * Categorizes process activities as VA (Value Added), NVA (Non-Value Added),
 * or NNVA (Necessary Non-Value Added) and computes time ratios.
 *
 * @reference Womack, J.P. & Jones, D.T. (1996). "Lean Thinking".
 * @reference Ohno, T. (1988). "Toyota Production System".
 *
 * @throws {RangeError} Activities array must have at least 1 element
 * @throws {RangeError} All activity durations must be non-negative
 */
export function vaAnalysis(input: VaAnalysisInput): VaAnalysisResult {
  const { activities } = input;

  if (!Array.isArray(activities) || activities.length < 1) {
    throw new RangeError('Activities array must have at least 1 element');
  }

  for (let i = 0; i < activities.length; i++) {
    if (!Number.isFinite(activities[i].duration) || activities[i].duration < 0) {
      throw new RangeError('All activity durations must be non-negative');
    }
  }

  const totalDuration = activities.reduce((s, a) => s + a.duration, 0);

  const buildSummary = (category: 'VA' | 'NVA' | 'NNVA'): CategorySummary => {
    const filtered = activities.filter(a => a.category === category);
    const catTotal = filtered.reduce((s, a) => s + a.duration, 0);
    return {
      count: filtered.length,
      totalDuration: roundTo(catTotal, 4),
      ratio: totalDuration > 0 ? roundTo(catTotal / totalDuration, 4) : 0,
    };
  };

  const va = buildSummary('VA');
  const nva = buildSummary('NVA');
  const nnva = buildSummary('NNVA');

  return {
    totalDuration: roundTo(totalDuration, 4),
    va,
    nva,
    nnva,
    vaRatio: va.ratio,
  };
}
