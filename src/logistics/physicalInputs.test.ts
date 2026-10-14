import { describe, it, expect } from 'vitest';
import { abcAnalysis } from './abcAnalysis.js';
import { cbm } from './cbm.js';
import { serviceLevel } from './fillRate.js';
import { loadCapacity } from './loadCapacity.js';
import { pallet3d } from './pallet3d.js';
import { pickTime } from './pickTime.js';
import { safetyStock } from './safetyStock.js';
import { inventoryTurnover } from './inventoryTurnover.js';

// A negative usage, dimension, stock, distance or period used to come back as a sign-flipped
// "result" (or, for loadCapacity, an all-zero sentinel). Each is now refused, and the boundary
// the formula still supports is accepted.

describe('abcAnalysis refuses negative physical inputs', () => {
  it('throws for a negative annual usage or unit cost', () => {
    expect(() => abcAnalysis({ items: [{ sku: 'SKU-001', annualUsage: 1000, unitCost: 50 }, { sku: 'SKU-002', annualUsage: -500, unitCost: 80 }] })).toThrow(RangeError);
    expect(() => abcAnalysis({ items: [{ sku: 'SKU-001', annualUsage: 1000, unitCost: 50 }, { sku: 'SKU-002', annualUsage: 500, unitCost: -80 }] })).toThrow(RangeError);
  });
  it('accepts an item with zero usage', () => {
    const r = abcAnalysis({ items: [{ sku: 'SKU-001', annualUsage: 1000, unitCost: 50 }, { sku: 'SKU-002', annualUsage: 0, unitCost: 80 }] });
    expect(r.totalValue).toBe(50000);
    expect(r.items[0].sku).toBe('SKU-001');
    expect(r.items[1].annualValue).toBe(0);
  });
});

describe('cbm refuses negative physical inputs', () => {
  it('throws for a negative dimension or quantity', () => {
    expect(() => cbm({ length: -100, width: 50, height: 40, quantity: 1, unit: 'cm' })).toThrow(RangeError);
    expect(() => cbm({ length: 100, width: 50, height: -40, quantity: 1, unit: 'cm' })).toThrow(RangeError);
    expect(() => cbm({ length: 100, width: 50, height: 40, quantity: -1, unit: 'cm' })).toThrow(RangeError);
  });
  it('accepts a single 1 m cube', () => {
    const r = cbm({ length: 1, width: 1, height: 1, quantity: 1, unit: 'm' });
    expect(r.totalCbm).toBe(1);
  });
});

describe('serviceLevel refuses negative physical inputs', () => {
  it('throws for a negative standard deviation', () => {
    expect(() => serviceLevel({ demandStdDev: -100, safetyStock: 165 })).toThrow(RangeError);
  });
  it('accepts zero safety stock (50%)', () => {
    const r = serviceLevel({ demandStdDev: 100, safetyStock: 0 });
    expect(r.serviceLevel).toBe(50);
  });
});

describe('loadCapacity refuses negative physical inputs', () => {
  it('throws for a negative rated capacity or load centre', () => {
    expect(() => loadCapacity({ ratedCapacity: -2500, ratedLoadCenter: 500, actualLoadCenter: 750 })).toThrow(RangeError);
    expect(() => loadCapacity({ ratedCapacity: 2500, ratedLoadCenter: -500, actualLoadCenter: 750 })).toThrow(RangeError);
    expect(() => loadCapacity({ ratedCapacity: 2500, ratedLoadCenter: 500, actualLoadCenter: -750 })).toThrow(RangeError);
  });
  it('accepts a load centre at the rated one', () => {
    const r = loadCapacity({ ratedCapacity: 2500, ratedLoadCenter: 500, actualLoadCenter: 500, actualLoad: 0 });
    expect(r.effectiveCapacity).toBe(2500);
    expect(r.utilization).toBe(0);
  });
});

describe('pallet3d refuses negative physical inputs', () => {
  it('throws for a negative box side or custom pallet side', () => {
    expect(() => pallet3d({ palletStandard: 'eur', maxStackHeight: 1500, maxPayload: 1200, boxes: [{ id: 'box1', length: -400, width: 300, height: 200, weight: 10, quantity: 10, canRotate: 'layered' }] })).toThrow(RangeError);
    expect(() => pallet3d({ palletStandard: 'eur', maxStackHeight: 1500, maxPayload: 1200, boxes: [{ id: 'box1', length: 400, width: 300, height: 0, weight: 10, quantity: 10, canRotate: 'layered' }] })).toThrow(RangeError);
    expect(() => pallet3d({ palletStandard: 'custom', customLength: -1200, customWidth: 800, maxStackHeight: 1500, maxPayload: 1200, boxes: [{ id: 'box1', length: 400, width: 300, height: 200, weight: 10, quantity: 10, canRotate: 'layered' }] })).toThrow(RangeError);
    expect(() => pallet3d({ palletStandard: 'eur', maxStackHeight: -1500, maxPayload: 1200, boxes: [{ id: 'box1', length: 400, width: 300, height: 200, weight: 10, quantity: 10, canRotate: 'layered' }] })).toThrow(RangeError);
  });
  it('accepts a box that exactly covers a custom pallet', () => {
    const r = pallet3d({ palletStandard: 'custom', customLength: 1000, customWidth: 1000, maxStackHeight: 500, maxPayload: 1200, boxes: [{ id: 'box1', length: 1000, width: 1000, height: 500, weight: 10, quantity: 1, canRotate: 'fixed' }] });
    expect(r.placed.length).toBe(1);
    expect(r.utilization.floorPercent).toBe(100);
  });
});

describe('pickTime refuses negative physical inputs', () => {
  it('throws for a negative distance or time', () => {
    expect(() => pickTime({ mode: 'single', distance: -100, speed: 50, itemsPerOrder: 5, searchTimePerItem: 10, pickTimePerItem: 5, documentationTime: 30 })).toThrow(RangeError);
    expect(() => pickTime({ mode: 'single', distance: 100, speed: 50, itemsPerOrder: 5, searchTimePerItem: -10, pickTimePerItem: 5, documentationTime: 30 })).toThrow(RangeError);
    expect(() => pickTime({ mode: 'single', distance: 100, speed: 50, itemsPerOrder: 5, searchTimePerItem: 10, pickTimePerItem: -5, documentationTime: 30 })).toThrow(RangeError);
    expect(() => pickTime({ mode: 'single', distance: 100, speed: 50, itemsPerOrder: 5, searchTimePerItem: 10, pickTimePerItem: 5, documentationTime: -30 })).toThrow(RangeError);
  });
  it('accepts a zero distance (pick at the pick face)', () => {
    const r = pickTime({ mode: 'single', distance: 0, speed: 50, itemsPerOrder: 5, searchTimePerItem: 10, pickTimePerItem: 5, documentationTime: 30 });
    // 0 + 5 × 10 + 5 × 5 + 30 = 105 s
    expect(r.travelTime).toBe(0);
    expect(r.totalTime).toBe(105);
  });
});

describe('safetyStock refuses negative physical inputs', () => {
  it('throws for a negative demand or standard deviation', () => {
    expect(() => safetyStock({ avgDemand: -100, demandStdDev: 20, avgLeadTime: 5, leadTimeStdDev: 1, serviceLevel: 0.95 })).toThrow(RangeError);
    expect(() => safetyStock({ avgDemand: 100, demandStdDev: -20, avgLeadTime: 5, leadTimeStdDev: 1, serviceLevel: 0.95 })).toThrow(RangeError);
    expect(() => safetyStock({ avgDemand: 100, demandStdDev: 20, avgLeadTime: 5, leadTimeStdDev: -1, serviceLevel: 0.95 })).toThrow(RangeError);
  });
  it('accepts zero average demand', () => {
    const r = safetyStock({ avgDemand: 0, demandStdDev: 20, avgLeadTime: 4, leadTimeStdDev: 1, serviceLevel: 0.95 });
    // σ_DDLT = √(4 × 20²) = 40; lead-time demand 0
    expect(r.demandDuringLeadTime).toBe(0);
    expect(r.safetyStock).toBe(66);
  });
});

describe('inventoryTurnover refuses a non-positive period', () => {
  it('throws for a negative or zero period', () => {
    expect(() => inventoryTurnover({ cogs: 5000000, averageInventory: 1000000, periodDays: -365 })).toThrow(RangeError);
    expect(() => inventoryTurnover({ cogs: 5000000, averageInventory: 1000000, periodDays: 0 })).toThrow(RangeError);
  });
  it('accepts a one-day period and a negative gross margin', () => {
    const r = inventoryTurnover({ cogs: 5000000, averageInventory: 1000000, periodDays: 1, grossMargin: -100000 });
    expect(r.daysOfSupply).toBe(0.2);
    expect(r.gmroii).toBe(-10);
  });
});
