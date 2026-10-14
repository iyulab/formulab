import { roundTo, requireFinite } from '../utils.js';
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
 *
 * @throws {RangeError} items is empty, an item's annualUsage or unitCost is negative, or every
 *   item's annual value is 0 (there is no share to classify by)
 */
export function abcAnalysis(input: AbcInput): AbcResult {
  requireFinite('abcAnalysis', input);
  const { items, thresholdA = 80, thresholdB = 95 } = input;

  // A negative usage or cost gives a negative annual value, which sorts below every real item
  // and pulls the cumulative share past 100%.
  for (const item of items) {
    if (!(item.annualUsage >= 0)) {
      throw new RangeError('annualUsage must not be negative');
    }
    if (!(item.unitCost >= 0)) {
      throw new RangeError('unitCost must not be negative');
    }
  }

  const withValues = items.map(item => ({
    ...item,
    annualValue: item.annualUsage * item.unitCost,
  }));

  const totalValue = withValues.reduce((s, item) => s + item.annualValue, 0);
  const totalItems = items.length;

  // Each class is a share of the total annual value — with no items, or no value among them,
  // there is no share to rank by. Every item landing in 'C' would read as a classification.
  if (totalItems === 0) {
    throw new RangeError('items must not be empty');
  }
  if (!(totalValue > 0)) {
    throw new RangeError('the items have no annual value to classify (every usage × unitCost is 0)');
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
