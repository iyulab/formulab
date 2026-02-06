import { describe, it, expect } from 'vitest';
import { scope1Emissions } from './scope1Emissions.js';

describe('scope1Emissions', () => {
  it('should calculate natural gas emissions: 1000 m³ × 1.885 = 1885 kgCO2', () => {
    const result = scope1Emissions({ fuelType: 'naturalGas', quantity: 1000 });
    expect(result.co2Kg).toBeCloseTo(1885, 0);
    expect(result.co2Tonnes).toBeCloseTo(1.885, 3);
    expect(result.emissionFactor).toBe(1.885);
    expect(result.unit).toBe('m³');
  });

  it('should calculate diesel emissions: 500 L × 2.68 = 1340 kgCO2', () => {
    const result = scope1Emissions({ fuelType: 'diesel', quantity: 500 });
    expect(result.co2Kg).toBeCloseTo(1340, 0);
    expect(result.co2Tonnes).toBeCloseTo(1.34, 2);
  });

  it('should calculate gasoline emissions: 200 L × 2.31 = 462 kgCO2', () => {
    const result = scope1Emissions({ fuelType: 'gasoline', quantity: 200 });
    expect(result.co2Kg).toBeCloseTo(462, 0);
  });

  it('should calculate LPG emissions: 300 L × 1.51 = 453 kgCO2', () => {
    const result = scope1Emissions({ fuelType: 'lpg', quantity: 300 });
    expect(result.co2Kg).toBeCloseTo(453, 0);
  });

  it('should calculate coal emissions: 1000 kg × 2.42 = 2420 kgCO2', () => {
    const result = scope1Emissions({ fuelType: 'coal', quantity: 1000 });
    expect(result.co2Kg).toBeCloseTo(2420, 0);
    expect(result.unit).toBe('kg');
  });

  it('should calculate fuel oil emissions: 100 L × 3.15 = 315 kgCO2', () => {
    const result = scope1Emissions({ fuelType: 'fuelOil', quantity: 100 });
    expect(result.co2Kg).toBeCloseTo(315, 0);
  });

  it('should handle large quantities', () => {
    const result = scope1Emissions({ fuelType: 'naturalGas', quantity: 1000000 });
    expect(result.co2Tonnes).toBeCloseTo(1885, 0);
  });

  it('should handle zero quantity', () => {
    const result = scope1Emissions({ fuelType: 'diesel', quantity: 0 });
    expect(result.co2Kg).toBe(0);
    expect(result.co2Tonnes).toBe(0);
  });
});
