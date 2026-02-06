import { describe, it, expect } from 'vitest';
import { emissionsIntensity } from './emissionsIntensity.js';

describe('emissionsIntensity', () => {
  it('should calculate all metrics when all denominators provided', () => {
    const result = emissionsIntensity({
      totalCo2Kg: 100000,
      productionUnits: 10000,
      revenueUsd: 5000000,
      employees: 200,
    });
    expect(result.kgPerUnit).toBeCloseTo(10, 2);
    expect(result.kgPerRevenue).toBeCloseTo(0.02, 4);
    expect(result.kgPerEmployee).toBeCloseTo(500, 0);
    expect(result.tonnesPerMillionUsd).toBeCloseTo(20, 0);
  });

  it('should handle only production units', () => {
    const result = emissionsIntensity({
      totalCo2Kg: 50000,
      productionUnits: 5000,
    });
    expect(result.kgPerUnit).toBeCloseTo(10, 2);
    expect(result.kgPerRevenue).toBeUndefined();
    expect(result.kgPerEmployee).toBeUndefined();
  });

  it('should handle only revenue', () => {
    const result = emissionsIntensity({
      totalCo2Kg: 200000,
      revenueUsd: 10000000,
    });
    expect(result.kgPerRevenue).toBeCloseTo(0.02, 4);
    expect(result.tonnesPerMillionUsd).toBeCloseTo(20, 0);
    expect(result.kgPerUnit).toBeUndefined();
  });

  it('should handle only employee count', () => {
    const result = emissionsIntensity({
      totalCo2Kg: 500000,
      employees: 1000,
    });
    expect(result.kgPerEmployee).toBeCloseTo(500, 0);
  });

  it('should handle large manufacturing facility', () => {
    // 10,000 tonnes CO2, 1M units, $50M revenue, 500 employees
    const result = emissionsIntensity({
      totalCo2Kg: 10000000,
      productionUnits: 1000000,
      revenueUsd: 50000000,
      employees: 500,
    });
    expect(result.kgPerUnit).toBeCloseTo(10, 2);
    expect(result.tonnesPerMillionUsd).toBeCloseTo(200, 0);
    expect(result.kgPerEmployee).toBeCloseTo(20000, 0);
  });
});
