import { describe, it, expect } from 'vitest';
import { paretoAnalysis } from './paretoAnalysis.js';

describe('paretoAnalysis', () => {
  const sampleItems = [
    { name: 'Defect A', value: 50 },
    { name: 'Defect B', value: 30 },
    { name: 'Defect C', value: 10 },
    { name: 'Defect D', value: 5 },
    { name: 'Defect E', value: 3 },
    { name: 'Defect F', value: 2 },
  ];

  describe('classification', () => {
    it('should sort items by value descending', () => {
      const result = paretoAnalysis({ items: sampleItems });
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i].value).toBeLessThanOrEqual(result.items[i - 1].value);
      }
    });

    it('should assign correct ranks', () => {
      const result = paretoAnalysis({ items: sampleItems });
      result.items.forEach((item, i) => {
        expect(item.rank).toBe(i + 1);
      });
    });

    it('should calculate cumulative percentages correctly', () => {
      const result = paretoAnalysis({ items: sampleItems });
      const lastItem = result.items[result.items.length - 1];
      expect(lastItem.cumulative).toBeCloseTo(100, 0);
    });

    it('should apply 80/20 rule with default thresholds', () => {
      const result = paretoAnalysis({ items: sampleItems });
      // Total = 100, A threshold at 80%
      // Defect A (50%) + Defect B (30%) = 80% → both A
      const aItems = result.items.filter(i => i.category === 'A');
      expect(aItems.length).toBe(2);
      expect(aItems[0].name).toBe('Defect A');
      expect(aItems[1].name).toBe('Defect B');
    });
  });

  describe('custom thresholds', () => {
    it('should respect custom thresholdA', () => {
      const result = paretoAnalysis({ items: sampleItems, thresholdA: 50 });
      const aItems = result.items.filter(i => i.category === 'A');
      expect(aItems.length).toBe(1);
      expect(aItems[0].name).toBe('Defect A');
    });

    it('should respect custom thresholdB', () => {
      const result = paretoAnalysis({ items: sampleItems, thresholdA: 80, thresholdB: 90 });
      const cItems = result.items.filter(i => i.category === 'C');
      expect(cItems.length).toBeGreaterThan(0);
    });
  });

  describe('summary', () => {
    it('should compute summary counts', () => {
      const result = paretoAnalysis({ items: sampleItems });
      const totalCount = result.summary.a.count + result.summary.b.count + result.summary.c.count;
      expect(totalCount).toBe(sampleItems.length);
    });

    it('should compute summary percentages that sum to ~100', () => {
      const result = paretoAnalysis({ items: sampleItems });
      const totalPct = result.summary.a.percentage + result.summary.b.percentage + result.summary.c.percentage;
      expect(totalPct).toBeCloseTo(100, 0);
    });

    it('should compute summary totalValues that sum to totalValue', () => {
      const result = paretoAnalysis({ items: sampleItems });
      const summed = result.summary.a.totalValue + result.summary.b.totalValue + result.summary.c.totalValue;
      expect(summed).toBeCloseTo(result.totalValue, 0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      const result = paretoAnalysis({ items: [] });
      expect(result.items).toHaveLength(0);
      expect(result.totalValue).toBe(0);
    });

    it('should handle single item', () => {
      const result = paretoAnalysis({ items: [{ name: 'Only', value: 100 }] });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].category).toBe('A');
      expect(result.items[0].cumulative).toBeCloseTo(100, 0);
    });

    it('should handle all items with value 0', () => {
      const result = paretoAnalysis({
        items: [{ name: 'A', value: 0 }, { name: 'B', value: 0 }],
      });
      expect(result.totalValue).toBe(0);
      expect(result.items[0].category).toBe('C');
    });

    it('should handle equal values', () => {
      const result = paretoAnalysis({
        items: [
          { name: 'A', value: 25 },
          { name: 'B', value: 25 },
          { name: 'C', value: 25 },
          { name: 'D', value: 25 },
        ],
      });
      // Each 25% → cumulative: 25, 50, 75, 100
      expect(result.items[0].category).toBe('A');
      expect(result.items[1].category).toBe('A');
      expect(result.items[2].category).toBe('A');
      expect(result.items[3].category).toBe('C'); // 100 > 95
    });
  });
});
