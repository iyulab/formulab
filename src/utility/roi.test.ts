import { describe, it, expect } from 'vitest';
import { roi } from './roi.js';

describe('roi', () => {
  it('should calculate basic ROI', () => {
    const result = roi({ investment: 100000, annualReturn: 30000, years: 5 });
    expect(result).not.toBeNull();
    expect(result!.totalReturn).toBe(150000);
    expect(result!.netProfit).toBe(50000);
    expect(result!.roi).toBe(50); // 50% total ROI
  });

  it('should calculate payback period', () => {
    const result = roi({ investment: 100000, annualReturn: 25000, years: 5 });
    expect(result!.paybackPeriod).toBe(4); // 4 years
  });

  it('should calculate annualized ROI', () => {
    const result = roi({ investment: 10000, annualReturn: 3000, years: 5 });
    expect(result!.annualRoi).toBeGreaterThan(0);
    expect(result!.annualRoi).toBeLessThan(result!.roi);
  });

  it('should handle break-even scenario', () => {
    const result = roi({ investment: 10000, annualReturn: 2000, years: 5 });
    expect(result!.netProfit).toBe(0);
    expect(result!.roi).toBe(0);
  });

  it('should handle payback period less than 1 year', () => {
    const result = roi({ investment: 1000, annualReturn: 5000, years: 1 });
    expect(result!.paybackPeriod).toBe(0.2);
  });

  it('should return null for zero investment', () => {
    expect(roi({ investment: 0, annualReturn: 1000, years: 5 })).toBeNull();
  });

  it('should return null for negative years', () => {
    expect(roi({ investment: 1000, annualReturn: 100, years: -1 })).toBeNull();
  });

  it('should return null for negative return', () => {
    expect(roi({ investment: 1000, annualReturn: -100, years: 5 })).toBeNull();
  });
});
