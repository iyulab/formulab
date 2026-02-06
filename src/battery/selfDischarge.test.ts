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
