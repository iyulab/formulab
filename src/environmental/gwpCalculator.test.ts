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

  it('SF6: GWP100 = 24300 (AR6; cross-checked vs GHG Protocol AR6 tables), so 1 kg SF6 = 24300 kg CO2eq', () => {
    const result = gwpCalculator({ gas: 'SF6', quantityKg: 1 });
    expect(result.co2eqKg).toBeCloseTo(24300, 0);
    expect(result.co2eqTonnes).toBeCloseTo(24.3, 1);
  });

  it('should use GWP20 time horizon', () => {
    // CH4 GWP20 = 82.5
    const result = gwpCalculator({ gas: 'CH4', quantityKg: 100, timeHorizon: 'GWP20' });
    expect(result.co2eqKg).toBeCloseTo(8250, 0);
    expect(result.timeHorizon).toBe('GWP20');
  });

  it('should use GWP500 time horizon', () => {
    // CH4 (fossil) GWP500 = 10.0 per AR6; the previous 7.6 was the AR4 value
    const result = gwpCalculator({ gas: 'CH4', quantityKg: 100, timeHorizon: 'GWP500' });
    expect(result.co2eqKg).toBeCloseTo(1000, 0);
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

  describe('AR6 Table 7.SM.7 golden cells (verified against the published table)', () => {
    it('SF6 row uses the AR6-assessed 1000-year lifetime: 18200 / 24300 / 29000', () => {
      expect(gwpCalculator({ gas: 'SF6', quantityKg: 1, timeHorizon: 'GWP20' }).gwpFactor).toBe(18200);
      expect(gwpCalculator({ gas: 'SF6', quantityKg: 1, timeHorizon: 'GWP100' }).gwpFactor).toBe(24300);
      expect(gwpCalculator({ gas: 'SF6', quantityKg: 1, timeHorizon: 'GWP500' }).gwpFactor).toBe(29000);
    });

    it('NF3 GWP500 = 18200', () => {
      expect(gwpCalculator({ gas: 'NF3', quantityKg: 1, timeHorizon: 'GWP500' }).gwpFactor).toBe(18200);
    });

    it('HFC-152a GWP500 = 46.8', () => {
      expect(gwpCalculator({ gas: 'HFC152a', quantityKg: 1, timeHorizon: 'GWP500' }).gwpFactor).toBe(46.8);
    });

    it('CF4 (PFC-14) GWP grows with horizon: 5300 / 7380 / 10600', () => {
      expect(gwpCalculator({ gas: 'CF4', quantityKg: 1, timeHorizon: 'GWP20' }).gwpFactor).toBe(5300);
      expect(gwpCalculator({ gas: 'CF4', quantityKg: 1, timeHorizon: 'GWP100' }).gwpFactor).toBe(7380);
      expect(gwpCalculator({ gas: 'CF4', quantityKg: 1, timeHorizon: 'GWP500' }).gwpFactor).toBe(10600);
    });
  });
});
