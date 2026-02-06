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
    // CV: 20Ah / ((50+1)/2) = 20/25.5 ≈ 0.784h
    expect(result.cvPhaseAh).toBeCloseTo(20, 1);
    expect(result.cvPhaseTimeH).toBeCloseTo(0.78, 1);
    // Total ≈ 2.38h
    expect(result.totalTimeH).toBeCloseTo(2.38, 1);
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
    // CV: 15Ah / ((25+0.5)/2) = 15/12.75 ≈ 1.18h
    expect(result.cvPhaseAh).toBeCloseTo(15, 1);
    expect(result.cvPhaseTimeH).toBeCloseTo(1.18, 1);
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
    // CV: 20Ah / ((10+1)/2) = 20/5.5 ≈ 3.64h
    expect(result.cvPhaseTimeH).toBeCloseTo(3.64, 1);
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
