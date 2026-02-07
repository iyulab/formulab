import { roundTo } from '../utils.js';
import type { AbcInput, AbcResult, AbcClassification } from './types.js';

/**
 * ABC Inventory Analysis — Annual Value Classification
 *
 * @formula
 *   - Annual Value = usage × unitCost
 *   - Sort by annual value descending
 *   - A: cumulative ≤ thresholdA (default 80%)
 *   - B: thresholdA < cumulative ≤ thresholdB (default 95%)
 *   - C: remaining items
 *
 * @reference Silver, E.A. "Inventory Management and Production Planning and Scheduling", 3rd Ed.
 */
export function abcAnalysis(input: AbcInput): AbcResult {
  const { items, thresholdA = 80, thresholdB = 95 } = input;

  const withValues = items.map(item => ({
    ...item,
    annualValue: item.annualUsage * item.unitCost,
  }));

  const totalValue = withValues.reduce((s, item) => s + item.annualValue, 0);
  const totalItems = items.length;

  if (totalValue === 0 || totalItems === 0) {
    const classified: AbcClassification[] = withValues.map((item, i) => ({
      sku: item.sku,
      annualUsage: item.annualUsage,
      unitCost: item.unitCost,
      annualValue: 0,
      percentage: 0,
      cumulative: 0,
      rank: i + 1,
      category: 'C' as const,
    }));
    return {
      items: classified,
      summary: {
        a: { count: 0, skuPercentage: 0, valuePercentage: 0 },
        b: { count: 0, skuPercentage: 0, valuePercentage: 0 },
        c: { count: totalItems, skuPercentage: totalItems > 0 ? 100 : 0, valuePercentage: 0 },
      },
      totalItems,
      totalValue: 0,
    };
  }

  // Sort by annual value descending
  const sorted = [...withValues].sort((a, b) => b.annualValue - a.annualValue);

  let cumulative = 0;
  const classified: AbcClassification[] = sorted.map((item, i) => {
    const percentage = roundTo((item.annualValue / totalValue) * 100, 2);
    cumulative += percentage;

    let category: 'A' | 'B' | 'C';
    if (cumulative <= thresholdA) {
      category = 'A';
    } else if (cumulative <= thresholdB) {
      category = 'B';
    } else {
      category = 'C';
    }

    if (i === 0 && percentage > thresholdA) {
      category = 'A';
    }

    return {
      sku: item.sku,
      annualUsage: item.annualUsage,
      unitCost: item.unitCost,
      annualValue: roundTo(item.annualValue, 2),
      percentage,
      cumulative: roundTo(cumulative, 2),
      rank: i + 1,
      category,
    };
  });

  const summaryA = classified.filter(c => c.category === 'A');
  const summaryB = classified.filter(c => c.category === 'B');
  const summaryC = classified.filter(c => c.category === 'C');

  const sumVal = (arr: AbcClassification[]) => arr.reduce((s, c) => s + c.annualValue, 0);

  return {
    items: classified,
    summary: {
      a: {
        count: summaryA.length,
        skuPercentage: roundTo((summaryA.length / totalItems) * 100, 2),
        valuePercentage: roundTo((sumVal(summaryA) / totalValue) * 100, 2),
      },
      b: {
        count: summaryB.length,
        skuPercentage: roundTo((summaryB.length / totalItems) * 100, 2),
        valuePercentage: roundTo((sumVal(summaryB) / totalValue) * 100, 2),
      },
      c: {
        count: summaryC.length,
        skuPercentage: roundTo((summaryC.length / totalItems) * 100, 2),
        valuePercentage: roundTo((sumVal(summaryC) / totalValue) * 100, 2),
      },
    },
    totalItems,
    totalValue: roundTo(totalValue, 2),
  };
}
