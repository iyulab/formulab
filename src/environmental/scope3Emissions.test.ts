import { describe, it, expect } from 'vitest';
import { scope3Emissions } from './scope3Emissions.js';

describe('scope3Emissions', () => {
  it('should calculate purchased goods: $100,000 × 0.41 = 41,000 kgCO2eq', () => {
    const result = scope3Emissions({ category: 'purchasedGoods', spendUsd: 100000 });
    expect(result.co2Kg).toBeCloseTo(41000, 0);
    expect(result.co2Tonnes).toBeCloseTo(41, 0);
    expect(result.eeioFactor).toBe(0.41);
  });

  it('should calculate transportation: $50,000 × 0.58 = 29,000 kgCO2eq', () => {
    const result = scope3Emissions({ category: 'transportation', spendUsd: 50000 });
    expect(result.co2Kg).toBeCloseTo(29000, 0);
  });

  it('should calculate business travel: $20,000 × 0.45 = 9,000 kgCO2eq', () => {
    const result = scope3Emissions({ category: 'businessTravel', spendUsd: 20000 });
    expect(result.co2Kg).toBeCloseTo(9000, 0);
  });

  it('should calculate waste: $10,000 × 0.25 = 2,500 kgCO2eq', () => {
    const result = scope3Emissions({ category: 'waste', spendUsd: 10000 });
    expect(result.co2Kg).toBeCloseTo(2500, 0);
  });

  it('should calculate employee commuting: $30,000 × 0.30 = 9,000 kgCO2eq', () => {
    const result = scope3Emissions({ category: 'employeeCommuting', spendUsd: 30000 });
    expect(result.co2Kg).toBeCloseTo(9000, 0);
  });

  it('should handle large spend (million-dollar)', () => {
    const result = scope3Emissions({ category: 'capitalGoods', spendUsd: 1000000 });
    expect(result.co2Tonnes).toBeCloseTo(350, 0);
  });

  it('should handle zero spend', () => {
    const result = scope3Emissions({ category: 'fuelEnergy', spendUsd: 0 });
    expect(result.co2Kg).toBe(0);
  });
});
