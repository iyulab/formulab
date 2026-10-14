import { describe, it, expect } from 'vitest';
import { emissionsIntensity } from './emissionsIntensity.js';
import { gwpCalculator } from './gwpCalculator.js';
import { productCarbonFootprint } from './productCarbonFootprint.js';
import { scope1Emissions } from './scope1Emissions.js';
import { scope2Emissions } from './scope2Emissions.js';
import { scope3Emissions } from './scope3Emissions.js';
import { esgSummary } from './esgSummary.js';

// A negative quantity, factor, spend or CO2 amount used to come back as a negative emission
// "result". Offsets and removals are outside these functions' models, so each is now refused,
// and the zero boundary is accepted.

describe('emissionsIntensity refuses negative physical inputs', () => {
  it('throws for a negative total or a negative denominator', () => {
    expect(() => emissionsIntensity({ totalCo2Kg: -100000, productionUnits: 10000 })).toThrow(RangeError);
    expect(() => emissionsIntensity({ totalCo2Kg: 100000, productionUnits: -10000 })).toThrow(RangeError);
    expect(() => emissionsIntensity({ totalCo2Kg: 100000, revenueUsd: -5000000 })).toThrow(RangeError);
    expect(() => emissionsIntensity({ totalCo2Kg: 100000, employees: -200 })).toThrow(RangeError);
  });
  it('accepts a zero total and leaves a zero denominator unreported', () => {
    const r = emissionsIntensity({ totalCo2Kg: 0, productionUnits: 10000, employees: 0 });
    expect(r.kgPerUnit).toBe(0);
    expect(r.kgPerEmployee).toBeUndefined();
  });
});

describe('gwpCalculator refuses negative physical inputs', () => {
  it('throws for a negative quantity', () => {
    expect(() => gwpCalculator({ gas: 'CH4', quantityKg: -100 })).toThrow(RangeError);
  });
  it('accepts a zero quantity', () => {
    const r = gwpCalculator({ gas: 'SF6', quantityKg: 0 });
    expect(r.co2eqKg).toBe(0);
    expect(r.gwpFactor).toBe(24300);
  });
});

describe('productCarbonFootprint refuses a non-numeric quantity', () => {
  it('throws for a NaN or negative production quantity', () => {
    expect(() => productCarbonFootprint({ stages: [{ name: 'Manufacturing', co2Kg: 500 }], productionQuantity: NaN })).toThrow(RangeError);
    expect(() => productCarbonFootprint({ stages: [{ name: 'Manufacturing', co2Kg: 500 }], productionQuantity: -100 })).toThrow(RangeError);
  });
  it('accepts a recycling credit stage', () => {
    const r = productCarbonFootprint({ stages: [{ name: 'Manufacturing', co2Kg: 500 }, { name: 'End of life', co2Kg: -100 }], productionQuantity: 100 });
    expect(r.totalCo2Kg).toBe(400);
    expect(r.perUnitCo2Kg).toBe(4);
  });
});

describe('scope1Emissions refuses negative physical inputs', () => {
  it('throws for a negative fuel quantity', () => {
    expect(() => scope1Emissions({ fuelType: 'diesel', quantity: -1000 })).toThrow(RangeError);
  });
  it('accepts a zero quantity', () => {
    const r = scope1Emissions({ fuelType: 'diesel', quantity: 0 });
    expect(r.co2Kg).toBe(0);
  });
});

describe('scope2Emissions refuses negative physical inputs', () => {
  it('throws for a negative consumption or emission factor', () => {
    expect(() => scope2Emissions({ electricityKwh: -10000, region: 'Korea' })).toThrow(RangeError);
    expect(() => scope2Emissions({ electricityKwh: 10000, region: 'custom', customFactor: -300 })).toThrow(RangeError);
    expect(() => scope2Emissions({ electricityKwh: 10000, region: 'Korea', contractedKwh: 4000, supplierFactor: -50, residualMixFactor: 500 })).toThrow(RangeError);
    expect(() => scope2Emissions({ electricityKwh: 10000, region: 'Korea', contractedKwh: 4000, supplierFactor: 50, residualMixFactor: -500 })).toThrow(RangeError);
  });
  it('accepts a zero custom factor', () => {
    const r = scope2Emissions({ electricityKwh: 10000, region: 'custom', customFactor: 0 });
    expect(r.co2Kg).toBe(0);
  });
});

describe('scope3Emissions refuses negative physical inputs', () => {
  it('throws for a negative spend', () => {
    expect(() => scope3Emissions({ category: 'purchasedGoods', spendUsd: -100000 })).toThrow(RangeError);
  });
  it('accepts a zero spend', () => {
    const r = scope3Emissions({ category: 'purchasedGoods', spendUsd: 0 });
    expect(r.co2Kg).toBe(0);
  });
});

describe('esgSummary refuses negative physical inputs', () => {
  it('throws for a negative current or target amount, and a non-positive year', () => {
    expect(() => esgSummary({ baselineYear: 2020, baselineCo2Tonnes: 10000, currentYear: 2025, currentCo2Tonnes: -8000, targetYear: 2030, targetCo2Tonnes: 5000 })).toThrow(RangeError);
    expect(() => esgSummary({ baselineYear: 2020, baselineCo2Tonnes: 10000, currentYear: 2025, currentCo2Tonnes: 8000, targetYear: 2030, targetCo2Tonnes: -5000 })).toThrow(RangeError);
    expect(() => esgSummary({ baselineYear: 2020, baselineCo2Tonnes: 10000, currentYear: 2025, currentCo2Tonnes: 8000, targetYear: -2030, targetCo2Tonnes: 5000 })).toThrow(RangeError);
    expect(() => esgSummary({ baselineYear: 2020, baselineCo2Tonnes: 10000, currentYear: 2025, currentCo2Tonnes: 8000, targetYear: 0, targetCo2Tonnes: 5000 })).toThrow(RangeError);
  });
  it('accepts a net-zero target', () => {
    const r = esgSummary({ baselineYear: 2020, baselineCo2Tonnes: 10000, currentYear: 2025, currentCo2Tonnes: 8000, targetYear: 2030, targetCo2Tonnes: 0 });
    // (8000 − 0) / 10000 × 100 = 80% over 5 years = 16%/year
    expect(r.requiredAnnualRate).toBe(16);
    expect(r.yearsRemaining).toBe(5);
  });
});
