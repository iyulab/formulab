import { describe, it, expect } from 'vitest';
import { chargingProfile } from './chargingProfile.js';

describe('chargingProfile', () => {
  it('should calculate 100Ah battery at 50A CC, 1A cutoff', () => {
    const result = chargingProfile({
      capacityAh: 100,
      chargingCurrentA: 50,
      cutoffCurrentA: 1,
    });
    // CC: 80Ah / 50A = 1.6h
    expect(result.ccPhaseAh).toBeCloseTo(80, 1);
    expect(result.ccPhaseTimeH).toBeCloseTo(1.6, 2);
    // CV: τ = 20 Ah / (50 − 1) A = 0.40816 h; t = τ·ln(50/1) = 0.40816 × 3.91202 = 1.59674 h
    expect(result.cvPhaseAh).toBeCloseTo(20, 1);
    expect(result.cvTimeConstantH).toBeCloseTo(0.4082, 4);
    expect(result.cvPhaseTimeH).toBe(1.6);
    expect(result.cvPhaseTimeMin).toBe(95.8);
    // Total = 1.6 + 1.59674 = 3.19674 h
    expect(result.totalTimeH).toBe(3.2);
  });

  it('should handle custom CC end SOC (70%)', () => {
    const result = chargingProfile({
      capacityAh: 50,
      chargingCurrentA: 25,
      cutoffCurrentA: 0.5,
      ccEndSocPercent: 70,
    });
    // CC: 35Ah / 25A = 1.4h
    expect(result.ccPhaseAh).toBeCloseTo(35, 1);
    expect(result.ccPhaseTimeH).toBeCloseTo(1.4, 2);
    // CV: τ = 15 / 24.5 = 0.61224 h; t = τ·ln(50) = 2.39512 h
    expect(result.cvPhaseAh).toBeCloseTo(15, 1);
    expect(result.cvPhaseTimeH).toBe(2.4);
  });

  it('should handle 1C charging: 10Ah at 10A', () => {
    const result = chargingProfile({
      capacityAh: 10,
      chargingCurrentA: 10,
      cutoffCurrentA: 0.1,
    });
    // CC: 8Ah / 10A = 0.8h = 48 min
    expect(result.ccPhaseTimeH).toBeCloseTo(0.8, 2);
    expect(result.ccPhaseTimeMin).toBeCloseTo(48, 0);
    // Average C-rate = 1 / totalTimeH (≈ C/1.19)
    expect(result.averageCRate).toBeGreaterThan(0);
  });

  it('should calculate time in both hours and minutes', () => {
    const result = chargingProfile({
      capacityAh: 100,
      chargingCurrentA: 100,
      cutoffCurrentA: 5,
    });
    expect(result.ccPhaseTimeMin).toBeCloseTo(result.ccPhaseTimeH * 60, 0);
    expect(result.cvPhaseTimeMin).toBeCloseTo(result.cvPhaseTimeH * 60, 0);
    expect(result.totalTimeMin).toBeCloseTo(result.totalTimeH * 60, 0);
  });

  it('should handle slow charging: C/10', () => {
    const result = chargingProfile({
      capacityAh: 100,
      chargingCurrentA: 10,
      cutoffCurrentA: 1,
    });
    // CC: 80Ah / 10A = 8h
    expect(result.ccPhaseTimeH).toBeCloseTo(8, 1);
    // CV: τ = 20 / 9 = 2.2222 h; t = τ·ln(10) = 5.11686 h
    expect(result.cvPhaseTimeH).toBe(5.12);
  });

  it('should verify ccPhaseAh + cvPhaseAh = total capacity', () => {
    const result = chargingProfile({
      capacityAh: 280,
      chargingCurrentA: 56,
      cutoffCurrentA: 2.8,
    });
    expect(result.ccPhaseAh + result.cvPhaseAh).toBeCloseTo(280, 1);
  });
});

// ERRORS.md guarantees no NaN/Infinity in output fields; these inputs used to
// produce them instead of throwing.
describe('chargingProfile input domain', () => {
  it('rejects chargingCurrentA that would make an output non-finite', () => {
    expect(() => chargingProfile({ capacityAh: 100, chargingCurrentA: 0, cutoffCurrentA: 5 })).toThrow(RangeError);
  });

  it('rejects capacityAh that would make an output non-finite', () => {
    expect(() => chargingProfile({ capacityAh: 0, chargingCurrentA: 50, cutoffCurrentA: 5 })).toThrow(RangeError);
  });

  it('derives every minute value from the unrounded time, not from the rounded hours', () => {
    // 5 Ah at 2.5 A to a 0.25 A cutoff: τ = 1 Ah / 2.25 A = 0.44444 h, CV = τ·ln(10) = 1.02337 h = 61.40 min
    // (1.02 h × 60 would be 61.2), total = 1.6 + 1.02337 = 2.62337 h = 157.40 min
    const r = chargingProfile({ capacityAh: 5, chargingCurrentA: 2.5, cutoffCurrentA: 0.25 });
    expect(r.cvPhaseTimeMin).toBe(61.4);
    expect(r.totalTimeMin).toBe(157.4);
    expect(r.totalTimeH).toBe(2.62);
    expect(r.averageCRate).toBeCloseTo(1 / 2.62337, 4);
  });

  it('the CV current curve carries exactly the CV charge (∫ I dt = cvPhaseAh)', () => {
    const result = chargingProfile({ capacityAh: 100, chargingCurrentA: 50, cutoffCurrentA: 1 });
    const cv = result.currentCurve.slice(1);
    let ah = 0;
    // Exact integral of each exponential segment between samples: (I₀ − I₁)·τ.
    for (let i = 1; i < cv.length; i++) ah += (cv[i - 1].currentA - cv[i].currentA) * result.cvTimeConstantH;
    expect(ah).toBeCloseTo(result.cvPhaseAh, 1);
  });

  it('the curve is flat at Icc through the CC phase and ends at the cutoff at the total time', () => {
    const result = chargingProfile({ capacityAh: 5, chargingCurrentA: 2.5, cutoffCurrentA: 0.25 });
    const curve = result.currentCurve;
    expect(curve[0]).toEqual({ timeH: 0, currentA: 2.5 });
    expect(curve[1]).toEqual({ timeH: 1.6, currentA: 2.5 });
    expect(curve[curve.length - 1].currentA).toBe(0.25);
    expect(curve[curve.length - 1].timeH).toBeCloseTo(result.totalTimeH, 2);
    for (let i = 2; i < curve.length; i++) expect(curve[i].currentA).toBeLessThan(curve[i - 1].currentA);
  });

  it('the exponential taper is slower than a straight-line one (log mean < arithmetic mean)', () => {
    const result = chargingProfile({ capacityAh: 100, chargingCurrentA: 50, cutoffCurrentA: 2.5 });
    const straightLineH = 20 / ((50 + 2.5) / 2);
    expect(result.cvPhaseTimeH).toBeGreaterThan(straightLineH);
  });

  it('refuses a cutoff at or above the charging current — no taper is left to carry the CV charge', () => {
    expect(() => chargingProfile({ capacityAh: 10, chargingCurrentA: 5, cutoffCurrentA: 5 })).toThrow(
      'cutoffCurrentA must be less than chargingCurrentA',
    );
  });
});
