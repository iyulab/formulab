import { describe, it, expect } from 'vitest';
import { selfDischarge } from './selfDischarge.js';

describe('selfDischarge', () => {
  it('should calculate self-discharge: 0.1V drop over 30 days at 3.7V', () => {
    const result = selfDischarge({
      initialVoltage: 4.2,
      finalVoltage: 4.1,
      days: 30,
      nominalVoltage: 3.7,
    });
    // ΔV/day = 0.1/30 = 0.003333 V/day
    expect(result.voltageDropPerDay).toBeCloseTo(0.003333, 4);
    // daily% = 0.003333/3.7 × 100 = 0.0901%
    expect(result.dailyRatePercent).toBeCloseTo(0.0901, 2);
    // monthly% = 0.0901 × 30 = 2.70%
    expect(result.monthlyRatePercent).toBeCloseTo(2.7, 1);
  });

  it('should calculate low self-discharge (LFP): 0.02V over 60 days', () => {
    const result = selfDischarge({
      initialVoltage: 3.35,
      finalVoltage: 3.33,
      days: 60,
      nominalVoltage: 3.2,
    });
    // ΔV/day = 0.02/60 = 0.000333
    expect(result.voltageDropPerDay).toBeCloseTo(0.000333, 4);
    // monthly% = (0.000333/3.2 × 100) × 30 = 0.3125%
    expect(result.monthlyRatePercent).toBeCloseTo(0.31, 1);
  });

  it('should calculate high self-discharge (NiMH): 0.3V over 7 days', () => {
    const result = selfDischarge({
      initialVoltage: 1.4,
      finalVoltage: 1.1,
      days: 7,
      nominalVoltage: 1.2,
    });
    // ΔV/day = 0.3/7 = 0.04286
    expect(result.voltageDropPerDay).toBeCloseTo(0.042857, 3);
    // daily% = 0.04286/1.2 × 100 = 3.571%
    expect(result.dailyRatePercent).toBeCloseTo(3.5714, 1);
  });

  it('should handle zero voltage drop', () => {
    const result = selfDischarge({
      initialVoltage: 3.7,
      finalVoltage: 3.7,
      days: 30,
      nominalVoltage: 3.7,
    });
    expect(result.voltageDropPerDay).toBeCloseTo(0, 4);
    expect(result.monthlyRatePercent).toBeCloseTo(0, 2);
  });
});

// OCV screening is written in mV/day against the line's own limit. Example: a cell rested 30 days
// dropping 4.15 → 4.09 V decays 2 mV/day — far above screening limits of the order of 0.1–1 mV/day,
// although its 1.62 %/month of nominal voltage looks like a healthy Li-ion capacity figure.
describe('selfDischarge in mV/day against an acceptance limit', () => {
  it('reports the decay in mV/day', () => {
    const r = selfDischarge({ initialVoltage: 4.15, finalVoltage: 4.09, days: 30, nominalVoltage: 3.7 });
    expect(r.voltageDropMvPerDay).toBe(2);
    expect(r.voltageDropPerDay).toBe(0.002);
    expect(r.monthlyRatePercent).toBe(1.62);
    expect(r.withinLimit).toBeUndefined();
  });

  it('fails a cell whose decay exceeds the limit', () => {
    const r = selfDischarge({ initialVoltage: 4.15, finalVoltage: 4.09, days: 30, nominalVoltage: 3.7, limitMvPerDay: 1 });
    expect(r.withinLimit).toBe(false);
  });

  it('passes a cell at or under the limit (the limit itself passes)', () => {
    // 10 mV over 10 days = 1 mV/day exactly
    const atLimit = selfDischarge({ initialVoltage: 4.15, finalVoltage: 4.14, days: 10, nominalVoltage: 3.7, limitMvPerDay: 1 });
    expect(atLimit.voltageDropMvPerDay).toBe(1);
    expect(atLimit.withinLimit).toBe(true);
    const under = selfDischarge({ initialVoltage: 4.15, finalVoltage: 4.149, days: 10, nominalVoltage: 3.7, limitMvPerDay: 1 });
    expect(under.voltageDropMvPerDay).toBe(0.1);
    expect(under.withinLimit).toBe(true);
  });

  it('refuses a limit that is not greater than 0', () => {
    expect(() => selfDischarge({ initialVoltage: 4.15, finalVoltage: 4.09, days: 30, nominalVoltage: 3.7, limitMvPerDay: 0 })).toThrow(RangeError);
    expect(() => selfDischarge({ initialVoltage: 4.15, finalVoltage: 4.09, days: 30, nominalVoltage: 3.7, limitMvPerDay: -1 })).toThrow(RangeError);
  });
});

// ERRORS.md guarantees no NaN/Infinity in output fields; these inputs used to
// produce them instead of throwing.
describe('selfDischarge input domain', () => {
  it('rejects days that would make an output non-finite', () => {
    expect(() => selfDischarge({ initialVoltage: 4.1, finalVoltage: 4.0, days: 0, nominalVoltage: 3.7 })).toThrow(RangeError);
  });

  it('rejects nominalVoltage that would make an output non-finite', () => {
    expect(() => selfDischarge({ initialVoltage: 4.1, finalVoltage: 4.0, days: 30, nominalVoltage: 0 })).toThrow(RangeError);
  });
});
