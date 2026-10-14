import { describe, it, expect } from 'vitest';
import { cycleTime } from './cycle.js';
import { downtime } from './downtime.js';
import { dpmo } from './dpmo.js';
import { lineBalancing } from './lineBalancing.js';
import { oee } from './oee.js';
import { paretoAnalysis } from './paretoAnalysis.js';
import { ppm } from './ppm.js';
import { yieldCalc } from './yield.js';
import { acceptanceControlChart } from './acceptanceControlChart.js';

// A negative physical quantity has no meaning; returning a sign-flipped "result" for it presents
// garbage as a calculation. Each function refuses it, and accepts the domain boundary.
describe('quality: physical input domains', () => {
  it('cycleTime refuses a non-positive measurement', () => {
    expect(() => cycleTime({ measurements: [10, -1, 12] })).toThrow(RangeError);
    expect(() => cycleTime({ measurements: [10, NaN] })).toThrow(RangeError);
    const r = cycleTime({ measurements: [0.5] });
    expect(r.average).toBe(0.5);
    expect(r.cv).toBe(0);
  });

  it('downtime refuses a negative input and accepts 0', () => {
    expect(() => downtime({ hourlyRate: 100, laborCostPerHour: 50, downtimeMinutes: -30, plannedProductionUnits: 60, unitPrice: 10 })).toThrow(RangeError);
    expect(() => downtime({ hourlyRate: -100, laborCostPerHour: 50, downtimeMinutes: 30, plannedProductionUnits: 60, unitPrice: 10 })).toThrow(RangeError);
    const r = downtime({ hourlyRate: 100, laborCostPerHour: 50, downtimeMinutes: 60, plannedProductionUnits: 60, unitPrice: 0 });
    expect(r.lostRevenue).toBe(0);
    expect(r.totalCost).toBe(150);
  });

  it('dpmo refuses negative defects and defects beyond the opportunities', () => {
    expect(() => dpmo({ defects: -1, units: 100, opportunities: 5 })).toThrow(RangeError);
    expect(() => dpmo({ defects: 11, units: 5, opportunities: 2 })).toThrow(RangeError);
    const r = dpmo({ defects: 0, units: 100, opportunities: 5 });
    expect(r.dpmo).toBe(0);
    expect(r.yield).toBe(100);
    expect(r.sigmaLevel).toBe(6);
  });

  it('lineBalancing refuses a non-positive task time', () => {
    expect(() => lineBalancing({ cycleTime: 10, tasks: [{ id: 'A', name: 'A', time: -2, predecessors: [] }] })).toThrow(RangeError);
    const r = lineBalancing({ cycleTime: 1, tasks: [{ id: 'A', name: 'A', time: 0.5, predecessors: [] }] });
    expect(r.numStations).toBe(1);
    expect(r.lineEfficiency).toBe(50);
  });

  it('oee refuses negative times and counts and accepts goodCount 0', () => {
    expect(() => oee({ rawData: { plannedTime: -480, runTime: 400, totalCount: 800, goodCount: 760, idealCycleTime: 0.5 } })).toThrow(RangeError);
    expect(() => oee({ rawData: { plannedTime: 480, runTime: 400, totalCount: 800, goodCount: -1, idealCycleTime: 0.5 } })).toThrow(RangeError);
    const r = oee({ rawData: { plannedTime: 480, runTime: 400, totalCount: 800, goodCount: 0, idealCycleTime: 0.5 } });
    expect(r.factors.quality).toBe(0);
    expect(r.factors.oee).toBe(0);
  });

  it('paretoAnalysis refuses a negative item value and accepts 0', () => {
    expect(() => paretoAnalysis({ items: [{ name: 'a', value: 80 }, { name: 'b', value: -5 }] })).toThrow(RangeError);
    const r = paretoAnalysis({ items: [{ name: 'a', value: 80 }, { name: 'b', value: 0 }] });
    expect(r.totalValue).toBe(80);
    expect(r.items[0].percentage).toBe(100);
  });

  it('ppm refuses a negative value and accepts 0', () => {
    expect(() => ppm({ convertFrom: 'ppm', value: -1 })).toThrow(RangeError);
    expect(() => ppm({ convertFrom: 'defectRate', value: NaN })).toThrow(RangeError);
    const r = ppm({ convertFrom: 'ppm', value: 0 });
    expect(r.defectRate).toBe(0);
    expect(r.sigma).toBe(6);
  });

  it('yieldCalc refuses negative good units and accepts good 0', () => {
    expect(() => yieldCalc({ steps: [{ name: 'S1', good: -1, total: 100 }] })).toThrow(RangeError);
    expect(() => yieldCalc({ steps: [{ name: 'S1', good: 10, total: 0 }] })).toThrow(RangeError);
    const r = yieldCalc({ steps: [{ name: 'S1', good: 0, total: 100 }] });
    expect(r.rty).toBe(0);
    expect(r.expectedOutput).toBe(0);
  });

  it('acceptanceControlChart refuses a non-positive sigma but accepts a negative spec limit', () => {
    expect(() => acceptanceControlChart({ upperSpecLimit: -5, sigma: -0.1, acceptableProportion: 0.01, rejectableProportion: 0.05 })).toThrow(RangeError);
    expect(() => acceptanceControlChart({ upperSpecLimit: 5, sigma: NaN, acceptableProportion: 0.01, rejectableProportion: 0.05 })).toThrow(RangeError);
    const r = acceptanceControlChart({ lowerSpecLimit: -10, sigma: 1, acceptableProportion: 0.01, rejectableProportion: 0.05 });
    // APL = L + z(0.01)·σ = −10 + 2.3263
    expect(r.lower?.apl).toBeCloseTo(-7.6737, 3);
  });
});
