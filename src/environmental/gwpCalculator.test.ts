import { describe, it, expect } from 'vitest';
import { gwpCalculator } from './gwpCalculator.js';

describe('gwpCalculator', () => {
  it('CO2: GWP100 = 1, so 1000 kg CO2 = 1000 kg CO2eq', () => {
    const result = gwpCalculator({ gas: 'CO2', quantityKg: 1000 });
    expect(result.co2eqKg).toBeCloseTo(1000, 0);
    expect(result.gwpFactor).toBe(1);
  });

  it('CH4: GWP100 = 29.8, so 100 kg CH4 = 2980 kg CO2eq', () => {
    const result = gwpCalculator({ gas: 'CH4', quantityKg: 100 });
    expect(result.co2eqKg).toBeCloseTo(2980, 0);
    expect(result.co2eqTonnes).toBeCloseTo(2.98, 2);
  });

  it('N2O: GWP100 = 273, so 10 kg N2O = 2730 kg CO2eq', () => {
    const result = gwpCalculator({ gas: 'N2O', quantityKg: 10 });
    expect(result.co2eqKg).toBeCloseTo(2730, 0);
  });

  it('SF6: GWP100 = 25200, so 1 kg SF6 = 25200 kg CO2eq', () => {
    const result = gwpCalculator({ gas: 'SF6', quantityKg: 1 });
    expect(result.co2eqKg).toBeCloseTo(25200, 0);
    expect(result.co2eqTonnes).toBeCloseTo(25.2, 1);
  });

  it('should use GWP20 time horizon', () => {
    // CH4 GWP20 = 82.5
    const result = gwpCalculator({ gas: 'CH4', quantityKg: 100, timeHorizon: 'GWP20' });
    expect(result.co2eqKg).toBeCloseTo(8250, 0);
    expect(result.timeHorizon).toBe('GWP20');
  });

  it('should use GWP500 time horizon', () => {
    // CH4 GWP500 = 7.6
    const result = gwpCalculator({ gas: 'CH4', quantityKg: 100, timeHorizon: 'GWP500' });
    expect(result.co2eqKg).toBeCloseTo(760, 0);
  });

  it('HFC-134a: GWP100 = 1526 (refrigerant)', () => {
    const result = gwpCalculator({ gas: 'HFC134a', quantityKg: 5 });
    expect(result.co2eqKg).toBeCloseTo(7630, 0);
  });

  it('should default to GWP100', () => {
    const result = gwpCalculator({ gas: 'N2O', quantityKg: 1 });
    expect(result.timeHorizon).toBe('GWP100');
    expect(result.gwpFactor).toBe(273);
  });
});
