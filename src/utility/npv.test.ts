import { describe, it, expect } from 'vitest';
import { npv } from './npv.js';

describe('npv', () => {
  it('should calculate positive NPV', () => {
    const result = npv({
      initialInvestment: 10000,
      cashFlows: [3000, 4000, 5000, 6000],
      discountRate: 0.1,
    });
    expect(result).not.toBeNull();
    expect(result!.npv).toBeGreaterThan(0);
    expect(result!.profitabilityIndex).toBeGreaterThan(1);
  });

  it('should calculate negative NPV', () => {
    const result = npv({
      initialInvestment: 100000,
      cashFlows: [10000, 10000, 10000],
      discountRate: 0.1,
    });
    expect(result!.npv).toBeLessThan(0);
    expect(result!.profitabilityIndex).toBeLessThan(1);
  });

  it('should calculate IRR', () => {
    const result = npv({
      initialInvestment: 10000,
      cashFlows: [5000, 5000, 5000],
      discountRate: 0.1,
    });
    expect(result!.irr).not.toBeNull();
    expect(result!.irr!).toBeGreaterThan(0);
  });

  it('should verify IRR makes NPV zero', () => {
    const result = npv({
      initialInvestment: 10000,
      cashFlows: [4000, 4000, 4000],
      discountRate: 0.1,
    });
    if (result!.irr !== null) {
      // Verify: using IRR as discount rate should give NPV ≈ 0
      const irr = result!.irr;
      let checkNpv = -10000;
      [4000, 4000, 4000].forEach((cf, i) => {
        checkNpv += cf / (1 + irr) ** (i + 1);
      });
      expect(Math.abs(checkNpv)).toBeLessThan(0.01);
    }
  });

  it('should calculate with uniform cash flows', () => {
    const result = npv({
      initialInvestment: 5000,
      cashFlows: [2000, 2000, 2000, 2000],
      discountRate: 0.05,
    });
    expect(result!.npv).toBeGreaterThan(0);
  });

  it('should return null for empty cash flows', () => {
    expect(npv({
      initialInvestment: 1000, cashFlows: [], discountRate: 0.1,
    })).toBeNull();
  });

  it('should return null for invalid discount rate', () => {
    expect(npv({
      initialInvestment: 1000, cashFlows: [500], discountRate: -0.1,
    })).toBeNull();
    expect(npv({
      initialInvestment: 1000, cashFlows: [500], discountRate: 1,
    })).toBeNull();
  });

  it('should return null for negative investment', () => {
    expect(npv({
      initialInvestment: -1000, cashFlows: [500], discountRate: 0.1,
    })).toBeNull();
  });
});
