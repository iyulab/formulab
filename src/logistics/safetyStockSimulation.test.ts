import { describe, it, expect } from 'vitest';
import { safetyStockSimulation } from './safetyStockSimulation.js';
import { safetyStock } from './safetyStock.js';

const base = { avgDemand: 100, demandStdDev: 20, avgLeadTime: 7, leadTimeStdDev: 2, serviceLevel: 0.95 };

describe('safetyStockSimulation', () => {
  it('with no variability, demand during lead time is exactly avgDemand × avgLeadTime — part-days included', () => {
    const r = safetyStockSimulation({ avgDemand: 40, demandStdDev: 0, avgLeadTime: 7.5, leadTimeStdDev: 0, serviceLevel: 0.95, iterations: 100 });
    expect(r.meanDemandDuringLeadTime).toBe(300);
    expect(r.reorderPoint).toBe(300);
    expect(r.safetyStock).toBe(0);
    expect(r.achievedServiceLevel).toBe(1);
  });

  it('agrees with the normal-theory safety stock when demand and lead time are normal', () => {
    // σ_DDLT = √(7·20² + 100²·2²) = √42800 ≈ 206.9; z(0.95) = 1.645 → SS ≈ 340, ROP ≈ 1040.
    const analytical = safetyStock(base);
    const r = safetyStockSimulation({ ...base, iterations: 100_000 });
    expect(r.meanDemandDuringLeadTime).toBeGreaterThan(690);
    expect(r.meanDemandDuringLeadTime).toBeLessThan(710);
    expect(analytical.reorderPoint).toBe(1040);
    expect(r.stdDevDemandDuringLeadTime).toBeGreaterThan(200);
    expect(r.stdDevDemandDuringLeadTime).toBeLessThan(214);
    expect(Math.abs(r.reorderPoint - analytical.reorderPoint) / analytical.reorderPoint).toBeLessThan(0.03);
  });

  it('reports the share of trials its reorder point covers, at least the target', () => {
    const r = safetyStockSimulation(base);
    expect(r.achievedServiceLevel).toBeGreaterThanOrEqual(0.95);
    expect(r.stockoutProbability).toBeCloseTo(1 - r.achievedServiceLevel, 10);
  });

  it('is reproducible for a seed and differs for another', () => {
    expect(safetyStockSimulation(base)).toEqual(safetyStockSimulation(base));
    expect(safetyStockSimulation({ ...base, seed: 7 }).reorderPoint).not.toBe(safetyStockSimulation(base).reorderPoint);
  });

  it('samples Poisson daily demand around λ × L', () => {
    const r = safetyStockSimulation({ avgDemand: 5, demandStdDev: 0, avgLeadTime: 10, leadTimeStdDev: 0, serviceLevel: 0.9, demandDistribution: 'poisson', iterations: 20_000 });
    expect(r.meanDemandDuringLeadTime).toBeGreaterThanOrEqual(49);
    expect(r.meanDemandDuringLeadTime).toBeLessThanOrEqual(51);
    expect(r.stdDevDemandDuringLeadTime).toBeCloseTo(Math.sqrt(50), 0); // Poisson: variance = mean
  });

  it('bins every trial into the histogram', () => {
    const r = safetyStockSimulation({ ...base, iterations: 1000, bins: 12 });
    expect(r.histogram).toHaveLength(12);
    expect(r.histogram.reduce((s, b) => s + b.count, 0)).toBe(1000);
  });

  it.each([
    ['serviceLevel 1', { serviceLevel: 1 }],
    ['serviceLevel 0', { serviceLevel: 0 }],
    ['avgDemand 0', { avgDemand: 0 }],
    ['avgLeadTime 0', { avgLeadTime: 0 }],
    ['negative demandStdDev', { demandStdDev: -1 }],
    ['negative leadTimeStdDev', { leadTimeStdDev: -1 }],
    ['99 iterations', { iterations: 99 }],
    ['100001 iterations', { iterations: 100_001 }],
    ['fractional iterations', { iterations: 500.5 }],
    ['0 bins', { bins: 0 }],
    ['unknown distribution', { demandDistribution: 'gamma' as never }],
  ])('throws RangeError for %s', (_label, override) => {
    expect(() => safetyStockSimulation({ ...base, ...override })).toThrow(RangeError);
  });
});

describe('safetyStockSimulation coded refusals', () => {
  it('codes iterations out of range', () => {
    expect(() => safetyStockSimulation({ ...base, iterations: 99 })).toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'iterations', min: 100, max: 100_000, got: 99 }));
  });
  it('codes bins below 1', () => {
    expect(() => safetyStockSimulation({ ...base, bins: 0 })).toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'bins', min: 1, got: 0 }));
  });
  it('codes an unknown demand distribution', () => {
    expect(() => safetyStockSimulation({ ...base, demandDistribution: 'gamma' as never })).toThrow(expect.objectContaining({ code: 'unknown_option', parameter: 'demandDistribution', got: 'gamma' }));
  });
});
