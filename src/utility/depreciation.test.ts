import { describe, it, expect } from 'vitest';
import { depreciation } from './depreciation.js';

describe('depreciation', () => {
  describe('straight-line', () => {
    it('should calculate uniform annual depreciation', () => {
      const result = depreciation({
        assetCost: 100000,
        salvageValue: 10000,
        usefulLife: 5,
        method: 'straight-line',
      });
      expect(result).not.toBeNull();
      expect(result!.annualDepreciation).toBe(18000);
      expect(result!.totalDepreciation).toBe(90000);
      expect(result!.schedule).toHaveLength(5);
    });

    it('should have correct schedule progression', () => {
      const result = depreciation({
        assetCost: 50000,
        salvageValue: 5000,
        usefulLife: 3,
        method: 'straight-line',
      });
      expect(result!.schedule[0].bookValue).toBe(35000);
      expect(result!.schedule[1].bookValue).toBe(20000);
      expect(result!.schedule[2].bookValue).toBe(5000);
    });

    it('should have consistent accumulated depreciation', () => {
      const result = depreciation({
        assetCost: 10000,
        salvageValue: 1000,
        usefulLife: 3,
        method: 'straight-line',
      });
      expect(result!.schedule[0].accumulatedDepreciation).toBe(3000);
      expect(result!.schedule[1].accumulatedDepreciation).toBe(6000);
      expect(result!.schedule[2].accumulatedDepreciation).toBe(9000);
    });
  });

  describe('declining-balance', () => {
    it('should calculate higher depreciation in early years', () => {
      const result = depreciation({
        assetCost: 100000,
        salvageValue: 10000,
        usefulLife: 5,
        method: 'declining-balance',
      });
      expect(result).not.toBeNull();
      expect(result!.schedule[0].depreciation).toBeGreaterThan(result!.schedule[4].depreciation);
      expect(result!.totalDepreciation).toBe(90000);
    });

    it('should end at salvage value', () => {
      const result = depreciation({
        assetCost: 50000,
        salvageValue: 5000,
        usefulLife: 5,
        method: 'declining-balance',
      });
      const lastEntry = result!.schedule[result!.schedule.length - 1];
      expect(lastEntry.bookValue).toBeCloseTo(5000, 2);
    });

    it('should have decreasing annual depreciation', () => {
      const result = depreciation({
        assetCost: 100000,
        salvageValue: 10000,
        usefulLife: 4,
        method: 'declining-balance',
      });
      for (let i = 1; i < result!.schedule.length - 1; i++) {
        expect(result!.schedule[i].depreciation).toBeLessThan(result!.schedule[i - 1].depreciation);
      }
    });
  });

  it('should return null for zero asset cost', () => {
    expect(depreciation({
      assetCost: 0, salvageValue: 0, usefulLife: 5, method: 'straight-line',
    })).toBeNull();
  });

  it('should return null for salvage >= cost', () => {
    expect(depreciation({
      assetCost: 1000, salvageValue: 1000, usefulLife: 5, method: 'straight-line',
    })).toBeNull();
  });

  it('should return null for zero useful life', () => {
    expect(depreciation({
      assetCost: 1000, salvageValue: 100, usefulLife: 0, method: 'straight-line',
    })).toBeNull();
  });
});
