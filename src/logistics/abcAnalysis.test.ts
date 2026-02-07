import { describe, it, expect } from 'vitest';
import { abcAnalysis } from './abcAnalysis.js';

describe('abcAnalysis', () => {
  const sampleItems = [
    { sku: 'SKU-001', annualUsage: 1000, unitCost: 50 },    // 50000
    { sku: 'SKU-002', annualUsage: 500, unitCost: 80 },      // 40000
    { sku: 'SKU-003', annualUsage: 200, unitCost: 20 },      // 4000
    { sku: 'SKU-004', annualUsage: 100, unitCost: 10 },      // 1000
    { sku: 'SKU-005', annualUsage: 5000, unitCost: 0.5 },    // 2500
    { sku: 'SKU-006', annualUsage: 50, unitCost: 5 },        // 250
    { sku: 'SKU-007', annualUsage: 10, unitCost: 25 },       // 250
    { sku: 'SKU-008', annualUsage: 2000, unitCost: 0.5 },    // 1000
    { sku: 'SKU-009', annualUsage: 300, unitCost: 3 },       // 900
    { sku: 'SKU-010', annualUsage: 20, unitCost: 5 },        // 100
  ];
  // Total = 100000. SKU-001=50%, SKU-002=40%, cumulative 90% → both A

  describe('classification', () => {
    it('should sort by annual value descending', () => {
      const result = abcAnalysis({ items: sampleItems });
      for (let i = 1; i < result.items.length; i++) {
        expect(result.items[i].annualValue).toBeLessThanOrEqual(result.items[i - 1].annualValue);
      }
    });

    it('should classify A items (cumulative value ≤ threshold)', () => {
      const result = abcAnalysis({ items: sampleItems });
      const aItems = result.items.filter(i => i.category === 'A');
      // SKU-001 = 50% cumulative → A, SKU-002 = 90% cumulative → B (exceeds 80%)
      // Only 1 A item
      expect(aItems.length).toBe(1);
      expect(aItems[0].sku).toBe('SKU-001');
    });

    it('should assign cumulative percentages correctly', () => {
      const result = abcAnalysis({ items: sampleItems });
      const last = result.items[result.items.length - 1];
      expect(last.cumulative).toBeCloseTo(100, 0);
    });
  });

  describe('summary', () => {
    it('should have item counts that sum to total', () => {
      const result = abcAnalysis({ items: sampleItems });
      const total = result.summary.a.count + result.summary.b.count + result.summary.c.count;
      expect(total).toBe(sampleItems.length);
    });

    it('should have SKU percentages that sum to ~100', () => {
      const result = abcAnalysis({ items: sampleItems });
      const total = result.summary.a.skuPercentage + result.summary.b.skuPercentage + result.summary.c.skuPercentage;
      expect(total).toBeCloseTo(100, 0);
    });

    it('should have value percentages that sum to ~100', () => {
      const result = abcAnalysis({ items: sampleItems });
      const total = result.summary.a.valuePercentage + result.summary.b.valuePercentage + result.summary.c.valuePercentage;
      expect(total).toBeCloseTo(100, 0);
    });
  });

  describe('custom thresholds', () => {
    it('should respect custom threshold', () => {
      const result = abcAnalysis({ items: sampleItems, thresholdA: 50 });
      const aItems = result.items.filter(i => i.category === 'A');
      expect(aItems.length).toBe(1); // Only SKU-001 at 50%
    });
  });

  describe('edge cases', () => {
    it('should handle empty items', () => {
      const result = abcAnalysis({ items: [] });
      expect(result.items).toHaveLength(0);
      expect(result.totalItems).toBe(0);
      expect(result.totalValue).toBe(0);
    });

    it('should handle single item', () => {
      const result = abcAnalysis({ items: [{ sku: 'A', annualUsage: 100, unitCost: 10 }] });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].category).toBe('A');
    });
  });
});
