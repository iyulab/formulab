import { describe, it, expect } from 'vitest';
import { stateOfHealth } from './stateOfHealth.js';

describe('stateOfHealth', () => {
  it('should calculate SOH for new battery (100%)', () => {
    const result = stateOfHealth({ measuredCapacityAh: 100, ratedCapacityAh: 100 });
    expect(result.sohPercent).toBeCloseTo(100, 1);
    expect(result.capacityLoss).toBeCloseTo(0, 1);
    expect(result.status).toBe('excellent');
  });

  it('should calculate SOH for lightly used battery (90%)', () => {
    const result = stateOfHealth({ measuredCapacityAh: 90, ratedCapacityAh: 100 });
    expect(result.sohPercent).toBeCloseTo(90, 1);
    expect(result.capacityLoss).toBeCloseTo(10, 1);
    expect(result.capacityLossPercent).toBeCloseTo(10, 1);
    expect(result.status).toBe('excellent');
  });

  it('should return "good" for SOH 60-79%', () => {
    const result = stateOfHealth({ measuredCapacityAh: 70, ratedCapacityAh: 100 });
    expect(result.sohPercent).toBeCloseTo(70, 1);
    expect(result.status).toBe('good');
  });

  it('should return "degraded" for SOH 40-59%', () => {
    const result = stateOfHealth({ measuredCapacityAh: 50, ratedCapacityAh: 100 });
    expect(result.sohPercent).toBeCloseTo(50, 1);
    expect(result.status).toBe('degraded');
  });

  it('should return "poor" for SOH 20-39%', () => {
    const result = stateOfHealth({ measuredCapacityAh: 30, ratedCapacityAh: 100 });
    expect(result.sohPercent).toBeCloseTo(30, 1);
    expect(result.status).toBe('poor');
  });

  it('should return "endOfLife" for SOH < 20%', () => {
    const result = stateOfHealth({ measuredCapacityAh: 15, ratedCapacityAh: 100 });
    expect(result.sohPercent).toBeCloseTo(15, 1);
    expect(result.status).toBe('endOfLife');
  });

  it('should handle EV battery: 58kWh measured / 64kWh rated', () => {
    // 58/64 = 90.625%
    const result = stateOfHealth({ measuredCapacityAh: 58, ratedCapacityAh: 64 });
    expect(result.sohPercent).toBeCloseTo(90.63, 1);
    expect(result.capacityLoss).toBeCloseTo(6, 1);
    expect(result.status).toBe('excellent');
  });

  it('should handle boundary at 80% (threshold)', () => {
    const result = stateOfHealth({ measuredCapacityAh: 80, ratedCapacityAh: 100 });
    expect(result.sohPercent).toBeCloseTo(80, 1);
    expect(result.status).toBe('excellent');
  });

  it('should handle just below 80%', () => {
    const result = stateOfHealth({ measuredCapacityAh: 79.9, ratedCapacityAh: 100 });
    expect(result.status).toBe('good');
  });
});
