import { describe, it, expect } from 'vitest';
import { lcc } from './lcc.js';

describe('lcc', () => {
  it('should calculate life cycle cost', () => {
    const result = lcc({
      initialCost: 50000,
      annualOperatingCost: 5000,
      annualMaintenanceCost: 2000,
      disposalCost: 3000,
      lifespan: 10,
      discountRate: 0.05,
    });
    expect(result).not.toBeNull();
    expect(result!.totalLcc).toBeGreaterThan(50000);
    expect(result!.presentValueOperating).toBeGreaterThan(0);
    expect(result!.presentValueMaintenance).toBeGreaterThan(0);
    expect(result!.presentValueDisposal).toBeGreaterThan(0);
    expect(result!.annualEquivalentCost).toBeGreaterThan(0);
  });

  it('should discount future costs', () => {
    const result = lcc({
      initialCost: 0,
      annualOperatingCost: 1000,
      annualMaintenanceCost: 0,
      disposalCost: 0,
      lifespan: 5,
      discountRate: 0.1,
    });
    // PV of 5 years of 1000/yr at 10% < 5000 (undiscounted)
    expect(result!.totalLcc).toBeLessThan(5000);
    expect(result!.presentValueOperating).toBeCloseTo(3790.79, 0);
  });

  it('should handle zero discount rate', () => {
    const result = lcc({
      initialCost: 10000,
      annualOperatingCost: 1000,
      annualMaintenanceCost: 500,
      disposalCost: 2000,
      lifespan: 5,
      discountRate: 0,
    });
    expect(result!.presentValueOperating).toBe(5000);
    expect(result!.presentValueMaintenance).toBe(2500);
    expect(result!.presentValueDisposal).toBe(2000);
    expect(result!.totalLcc).toBe(19500);
  });

  it('should calculate annual equivalent cost', () => {
    const result = lcc({
      initialCost: 100000,
      annualOperatingCost: 10000,
      annualMaintenanceCost: 5000,
      disposalCost: 0,
      lifespan: 20,
      discountRate: 0.08,
    });
    expect(result!.annualEquivalentCost).toBeGreaterThan(0);
    // AEC should be greater than just operating + maintenance
    expect(result!.annualEquivalentCost).toBeGreaterThan(15000);
  });

  it('should discount disposal cost to present value', () => {
    const result = lcc({
      initialCost: 0,
      annualOperatingCost: 0,
      annualMaintenanceCost: 0,
      disposalCost: 10000,
      lifespan: 10,
      discountRate: 0.05,
    });
    expect(result!.presentValueDisposal).toBeLessThan(10000);
    expect(result!.presentValueDisposal).toBeCloseTo(6139, 0);
  });

  it('should return null for negative initial cost', () => {
    expect(lcc({
      initialCost: -1000, annualOperatingCost: 100, annualMaintenanceCost: 50,
      disposalCost: 0, lifespan: 5, discountRate: 0.05,
    })).toBeNull();
  });

  it('should return null for zero lifespan', () => {
    expect(lcc({
      initialCost: 1000, annualOperatingCost: 100, annualMaintenanceCost: 50,
      disposalCost: 0, lifespan: 0, discountRate: 0.05,
    })).toBeNull();
  });

  it('should return null for invalid discount rate', () => {
    expect(lcc({
      initialCost: 1000, annualOperatingCost: 100, annualMaintenanceCost: 50,
      disposalCost: 0, lifespan: 5, discountRate: 1,
    })).toBeNull();
  });
});
