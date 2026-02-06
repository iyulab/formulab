import { describe, it, expect } from 'vitest';
import { energyIntensity } from './energyIntensity.js';

describe('energyIntensity', () => {
  it('should calculate MJ/unit and kWh/unit', () => {
    // 10000 MJ / 500 units = 20 MJ/unit = 5.556 kWh/unit
    const result = energyIntensity({ totalEnergyMJ: 10000, productionUnits: 500 });
    expect(result.mjPerUnit).toBeCloseTo(20, 2);
    expect(result.kwhPerUnit).toBeCloseTo(5.5556, 2);
    expect(result.mjPerRevenue).toBeUndefined();
  });

  it('should calculate MJ/USD when revenue provided', () => {
    // 50000 MJ / $100,000 = 0.5 MJ/$
    const result = energyIntensity({
      totalEnergyMJ: 50000,
      productionUnits: 1000,
      revenueUsd: 100000,
    });
    expect(result.mjPerUnit).toBeCloseTo(50, 2);
    expect(result.mjPerRevenue).toBeCloseTo(0.5, 2);
  });

  it('should handle large factory: 1,000,000 MJ for 50,000 units', () => {
    const result = energyIntensity({ totalEnergyMJ: 1000000, productionUnits: 50000 });
    expect(result.mjPerUnit).toBeCloseTo(20, 2);
    expect(result.kwhPerUnit).toBeCloseTo(5.5556, 2);
  });

  it('should handle small batch: 100 MJ for 10 units', () => {
    const result = energyIntensity({ totalEnergyMJ: 100, productionUnits: 10 });
    expect(result.mjPerUnit).toBeCloseTo(10, 2);
    expect(result.kwhPerUnit).toBeCloseTo(2.7778, 2);
  });
});
