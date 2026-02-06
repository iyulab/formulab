import { describe, it, expect } from 'vitest';
import { bmsBalancing } from './bmsBalancing.js';

describe('bmsBalancing', () => {
  it('should detect balanced cells (delta <= 10mV)', () => {
    const result = bmsBalancing({
      cellVoltages: [3.300, 3.305, 3.302, 3.298],
      balancingCurrentMA: 50,
      cellCapacityAh: 100,
    });
    expect(result.isBalanced).toBe(true);
    expect(result.voltageDelta).toBeLessThanOrEqual(0.01);
  });

  it('should detect unbalanced cells (delta > 10mV)', () => {
    const result = bmsBalancing({
      cellVoltages: [3.300, 3.350, 3.310, 3.280],
      balancingCurrentMA: 50,
      cellCapacityAh: 100,
    });
    expect(result.isBalanced).toBe(false);
    expect(result.voltageDelta).toBeCloseTo(0.07, 3);
  });

  it('should calculate max and min voltages', () => {
    const result = bmsBalancing({
      cellVoltages: [3.200, 3.250, 3.180, 3.220],
      balancingCurrentMA: 100,
      cellCapacityAh: 50,
    });
    expect(result.maxVoltage).toBeCloseTo(3.250, 3);
    expect(result.minVoltage).toBeCloseTo(3.180, 3);
    expect(result.voltageDelta).toBeCloseTo(0.070, 3);
  });

  it('should identify which cells need balancing', () => {
    const result = bmsBalancing({
      cellVoltages: [3.300, 3.350, 3.300, 3.300],
      balancingCurrentMA: 50,
      cellCapacityAh: 100,
    });
    // Cell 1 (3.350V) is above average and needs balancing
    const cell1 = result.cellDetails[1];
    expect(cell1.deltaFromAvg).toBeGreaterThan(0);
    expect(cell1.balancingTimeMin).toBeGreaterThan(0);

    // Cell 0, 2, 3 should have minimal or zero balancing time
    expect(result.cellDetails[0].balancingTimeMin).toBeLessThanOrEqual(result.cellDetails[1].balancingTimeMin);
  });

  it('should return zero balancing time for perfectly balanced cells', () => {
    const result = bmsBalancing({
      cellVoltages: [3.300, 3.300, 3.300, 3.300],
      balancingCurrentMA: 50,
      cellCapacityAh: 100,
    });
    expect(result.isBalanced).toBe(true);
    expect(result.maxBalancingTimeMin).toBeCloseTo(0, 1);
    expect(result.voltageDelta).toBeCloseTo(0, 3);
  });

  it('should handle large pack (many cells)', () => {
    const voltages = [3.31, 3.30, 3.32, 3.29, 3.30, 3.31, 3.28, 3.30];
    const result = bmsBalancing({
      cellVoltages: voltages,
      balancingCurrentMA: 100,
      cellCapacityAh: 280,
    });
    expect(result.cellDetails).toHaveLength(8);
    expect(result.maxVoltage).toBeCloseTo(3.32, 2);
    expect(result.minVoltage).toBeCloseTo(3.28, 2);
  });
});
