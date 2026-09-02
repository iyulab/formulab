import { describe, it, expect } from 'vitest';
import { scope2Emissions } from './scope2Emissions.js';

describe('scope2Emissions', () => {
  it('should calculate US average: 10000 kWh × 384 gCO2/kWh = 3840 kgCO2', () => {
    const result = scope2Emissions({ electricityKwh: 10000, region: 'US_average' });
    expect(result.co2Kg).toBeCloseTo(3840, 0);
    expect(result.co2Tonnes).toBeCloseTo(3.84, 2);
    expect(result.gridFactor).toBe(384);
  });

  it('should calculate Korea: 10000 kWh × 417 = 4170 kgCO2', () => {
    const result = scope2Emissions({ electricityKwh: 10000, region: 'Korea' });
    expect(result.co2Kg).toBeCloseTo(4170, 0);
  });

  it('should calculate France (low-carbon): 10000 kWh × 41 = 410 kgCO2', () => {
    const result = scope2Emissions({ electricityKwh: 10000, region: 'France' });
    expect(result.co2Kg).toBeCloseTo(410, 0);
  });

  it('should calculate India (high-carbon): 10000 kWh × 670 = 6700 kgCO2', () => {
    const result = scope2Emissions({ electricityKwh: 10000, region: 'India' });
    expect(result.co2Kg).toBeCloseTo(6700, 0);
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
    expect(result.co2Tonnes).toBeCloseTo(2625, 0);
  });

  it('should compare regions for same consumption', () => {
    const kWh = 100000;
    const france = scope2Emissions({ electricityKwh: kWh, region: 'France' });
    const australia = scope2Emissions({ electricityKwh: kWh, region: 'Australia' });
    // Australia should have much higher emissions than France
    expect(australia.co2Kg).toBeGreaterThan(france.co2Kg * 10);
  });

  // docket iyulab/formulab#133: GHG Protocol Scope 2 Guidance (2015) requires dual reporting
  // (location-based + market-based). market-based inputs are additive/optional and never embed a
  // region-keyed residual-mix table — callers supply residualMixFactor from their own disclosure
  // source (see @reference).
  describe('market-based dual reporting', () => {
    it('always mirrors co2Kg/co2Tonnes into locationBasedCo2Kg/Tonnes', () => {
      const result = scope2Emissions({ electricityKwh: 10000, region: 'US_average' });
      expect(result.locationBasedCo2Kg).toBe(result.co2Kg);
      expect(result.locationBasedCo2Tonnes).toBe(result.co2Tonnes);
    });

    it('omits marketBasedCo2Kg/Tonnes when no market-based input is supplied', () => {
      const result = scope2Emissions({ electricityKwh: 10000, region: 'US_average' });
      expect(result.marketBasedCo2Kg).toBeUndefined();
      expect(result.marketBasedCo2Tonnes).toBeUndefined();
    });

    it('computes 0 kg market-based for a fully-contracted 100% zero-carbon procurement', () => {
      // Full consumption covered by a zero-emission-factor contract (e.g. a solar/wind PPA) —
      // the "100% renewable procurement" case the missing market-based path made impossible.
      const result = scope2Emissions({
        electricityKwh: 10000,
        region: 'US_average',
        contractedKwh: 10000,
        supplierFactor: 0,
      });
      expect(result.marketBasedCo2Kg).toBe(0);
      // Location-based stays at the grid average regardless of what was contracted.
      expect(result.co2Kg).toBeCloseTo(3840, 0);
    });

    it('blends contracted and residual-mix portions: 4000kWh@50 + 6000kWh@500 = 3200 kgCO2', () => {
      const result = scope2Emissions({
        electricityKwh: 10000,
        region: 'US_average',
        contractedKwh: 4000,
        supplierFactor: 50,
        residualMixFactor: 500,
      });
      expect(result.marketBasedCo2Kg).toBeCloseTo(3200, 0);
      expect(result.marketBasedCo2Tonnes).toBeCloseTo(3.2, 2);
    });

    it('applies residualMixFactor to the whole consumption when no contract is supplied', () => {
      const result = scope2Emissions({
        electricityKwh: 8000,
        region: 'US_average',
        residualMixFactor: 450,
      });
      expect(result.marketBasedCo2Kg).toBeCloseTo(3600, 0);
    });

    it('throws when contractedKwh > 0 but supplierFactor is missing', () => {
      expect(() => scope2Emissions({
        electricityKwh: 10000,
        region: 'US_average',
        contractedKwh: 4000,
      })).toThrow();
    });

    it('throws when contractedKwh is negative', () => {
      expect(() => scope2Emissions({
        electricityKwh: 10000,
        region: 'US_average',
        contractedKwh: -1,
        supplierFactor: 50,
      })).toThrow();
    });

    it('throws when contractedKwh exceeds electricityKwh', () => {
      expect(() => scope2Emissions({
        electricityKwh: 10000,
        region: 'US_average',
        contractedKwh: 12000,
        supplierFactor: 50,
      })).toThrow();
    });

    it('throws when the uncontracted remainder has no residualMixFactor', () => {
      expect(() => scope2Emissions({
        electricityKwh: 10000,
        region: 'US_average',
        contractedKwh: 4000,
        supplierFactor: 50,
      })).toThrow();
    });
  });
});
