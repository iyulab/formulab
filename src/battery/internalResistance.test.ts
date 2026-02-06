import { describe, it, expect } from 'vitest';
import { internalResistance } from './internalResistance.js';

describe('internalResistance', () => {
  it('should calculate basic IR: (4.2V - 4.15V) / 10A = 5mΩ', () => {
    const result = internalResistance({
      openCircuitVoltage: 4.2,
      loadVoltage: 4.15,
      loadCurrentA: 10,
    });
    expect(result.resistanceMilliOhm).toBeCloseTo(5, 1);
    expect(result.resistanceOhm).toBeCloseTo(0.005, 4);
    expect(result.voltageDrop).toBeCloseTo(0.05, 3);
    // P = 10² × 0.005 = 0.5W
    expect(result.powerLossW).toBeCloseTo(0.5, 2);
  });

  it('should handle larger IR: (3.3V - 3.0V) / 5A = 60mΩ', () => {
    const result = internalResistance({
      openCircuitVoltage: 3.3,
      loadVoltage: 3.0,
      loadCurrentA: 5,
    });
    expect(result.resistanceMilliOhm).toBeCloseTo(60, 1);
    expect(result.resistanceOhm).toBeCloseTo(0.06, 4);
    // P = 25 × 0.06 = 1.5W
    expect(result.powerLossW).toBeCloseTo(1.5, 2);
  });

  it('should handle high current: (4.1V - 3.9V) / 100A = 2mΩ', () => {
    const result = internalResistance({
      openCircuitVoltage: 4.1,
      loadVoltage: 3.9,
      loadCurrentA: 100,
    });
    expect(result.resistanceMilliOhm).toBeCloseTo(2, 1);
    // P = 10000 × 0.002 = 20W
    expect(result.powerLossW).toBeCloseTo(20, 0);
  });

  it('should handle small voltage drop: 10mV at 1A = 10mΩ', () => {
    const result = internalResistance({
      openCircuitVoltage: 3.700,
      loadVoltage: 3.690,
      loadCurrentA: 1,
    });
    expect(result.resistanceMilliOhm).toBeCloseTo(10, 1);
    expect(result.voltageDrop).toBeCloseTo(0.01, 3);
  });
});
