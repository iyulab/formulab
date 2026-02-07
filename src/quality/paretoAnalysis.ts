import { roundTo } from '../utils.js';
import type { ParetoInput, ParetoResult, ParetoClassification } from './types.js';

/**
 * Pareto Analysis (80/20 Rule) — ABC Classification
 *
 * @formula Cumulative percentage-based classification
 *   - Sort items by value descending
 *   - Calculate cumulative percentage
 *   - Category A: cumulative ≤ thresholdA (default 80%)
 *   - Category B: thresholdA < cumulative ≤ thresholdB (default 95%)
 *   - Category C: cumulative > thresholdB
 *
 * @reference Juran, J.M. "Juran's Quality Handbook", 5th Ed.
 */
export function paretoAnalysis(input: ParetoInput): ParetoResult {
  const { items, thresholdA = 80, thresholdB = 95 } = input;

  const totalValue = items.reduce((s, item) => s + item.value, 0);

  if (totalValue === 0) {
    const classified: ParetoClassification[] = items.map((item, i) => ({
      name: item.name,
      value: item.value,
      percentage: 0,
      cumulative: 0,
      rank: i + 1,
      category: 'C' as const,
    }));
    return {
      items: classified,
      summary: {
        a: { count: 0, totalValue: 0, percentage: 0 },
        b: { count: 0, totalValue: 0, percentage: 0 },
        c: { count: items.length, totalValue: 0, percentage: 0 },
      },
      totalValue: 0,
    };
  }

  // Sort by value descending
  const sorted = [...items].sort((a, b) => b.value - a.value);

  let cumulative = 0;
  const classified: ParetoClassification[] = sorted.map((item, i) => {
    const percentage = roundTo((item.value / totalValue) * 100, 2);
    cumulative += percentage;

    let category: 'A' | 'B' | 'C';
    if (cumulative <= thresholdA) {
      category = 'A';
    } else if (cumulative <= thresholdB) {
      category = 'B';
    } else {
      category = 'C';
    }

    // First item always goes to A if thresholdA > 0
    if (i === 0 && percentage > thresholdA) {
      category = 'A';
    }

    return {
      name: item.name,
      value: item.value,
      percentage,
      cumulative: roundTo(cumulative, 2),
      rank: i + 1,
      category,
    };
  });

  // Summary
  const summaryA = classified.filter(c => c.category === 'A');
  const summaryB = classified.filter(c => c.category === 'B');
  const summaryC = classified.filter(c => c.category === 'C');

  const sumVal = (arr: ParetoClassification[]) => arr.reduce((s, c) => s + c.value, 0);

  return {
    items: classified,
    summary: {
      a: {
        count: summaryA.length,
        totalValue: roundTo(sumVal(summaryA), 2),
        percentage: roundTo((sumVal(summaryA) / totalValue) * 100, 2),
      },
      b: {
        count: summaryB.length,
        totalValue: roundTo(sumVal(summaryB), 2),
        percentage: roundTo((sumVal(summaryB) / totalValue) * 100, 2),
      },
      c: {
        count: summaryC.length,
        totalValue: roundTo(sumVal(summaryC), 2),
        percentage: roundTo((sumVal(summaryC) / totalValue) * 100, 2),
      },
    },
    totalValue: roundTo(totalValue, 2),
  };
}
