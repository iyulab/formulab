import { describe, it, expect } from 'vitest';
import { scope2Emissions } from './scope2Emissions.js';

describe('scope2Emissions', () => {
  it('should calculate US average: 10000 kWh × 386 gCO2/kWh = 3860 kgCO2', () => {
    const result = scope2Emissions({ electricityKwh: 10000, region: 'US_average' });
    expect(result.co2Kg).toBeCloseTo(3860, 0);
    expect(result.co2Tonnes).toBeCloseTo(3.86, 2);
    expect(result.gridFactor).toBe(386);
  });

  it('should calculate Korea: 10000 kWh × 415 = 4150 kgCO2', () => {
    const result = scope2Emissions({ electricityKwh: 10000, region: 'Korea' });
    expect(result.co2Kg).toBeCloseTo(4150, 0);
  });

  it('should calculate France (low-carbon): 10000 kWh × 56 = 560 kgCO2', () => {
    const result = scope2Emissions({ electricityKwh: 10000, region: 'France' });
    expect(result.co2Kg).toBeCloseTo(560, 0);
  });

  it('should calculate India (high-carbon): 10000 kWh × 708 = 7080 kgCO2', () => {
    const result = scope2Emissions({ electricityKwh: 10000, region: 'India' });
    expect(result.co2Kg).toBeCloseTo(7080, 0);
  });

  it('should handle custom region with custom factor', () => {
    const result = scope2Emissions({
      electricityKwh: 5000,
      region: 'custom',
      customFactor: 300,
    });
    // 5000 × 300 / 1000 = 1500 kgCO2
    expect(result.co2Kg).toBeCloseTo(1500, 0);
  });

  it('should throw for custom region without factor', () => {
    expect(() => scope2Emissions({
      electricityKwh: 5000,
      region: 'custom',
    })).toThrow();
  });

  it('should handle large consumption (factory)', () => {
    // Factory: 5,000,000 kWh/year in China
    const result = scope2Emissions({ electricityKwh: 5000000, region: 'China' });
    expect(result.co2Tonnes).toBeCloseTo(2775, 0);
  });

  it('should compare regions for same consumption', () => {
    const kWh = 100000;
    const france = scope2Emissions({ electricityKwh: kWh, region: 'France' });
    const australia = scope2Emissions({ electricityKwh: kWh, region: 'Australia' });
    // Australia should have much higher emissions than France
    expect(australia.co2Kg).toBeGreaterThan(france.co2Kg * 10);
  });
});
