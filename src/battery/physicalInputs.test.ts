import { describe, it, expect } from 'vitest';
import { bmsBalancing } from './bmsBalancing.js';
import { energyDensity } from './energyDensity.js';
import { internalResistance } from './internalResistance.js';
import { selfDischarge } from './selfDischarge.js';
import { stateOfHealth } from './stateOfHealth.js';
import { thermalRunaway } from './thermalRunaway.js';

// A negative physical quantity used to come back as a sign-flipped "result"; each is refused now.
describe('battery physical-input domains', () => {
  describe('bmsBalancing', () => {
    it('refuses a negative or NaN cell voltage', () => {
      expect(() => bmsBalancing({ cellVoltages: [3.6, -3.6], balancingCurrentMA: 100, cellCapacityAh: 3 })).toThrow(RangeError);
      expect(() => bmsBalancing({ cellVoltages: [3.6, NaN], balancingCurrentMA: 100, cellCapacityAh: 3 })).toThrow(RangeError);
    });

    it('accepts equal cells as balanced', () => {
      const result = bmsBalancing({ cellVoltages: [3.6, 3.6], balancingCurrentMA: 100, cellCapacityAh: 3 });
      expect(result.isBalanced).toBe(true);
      expect(result.maxBalancingTimeMin).toBe(0);
    });
  });

  describe('energyDensity', () => {
    it('refuses a non-positive capacity or voltage', () => {
      expect(() => energyDensity({ capacityAh: -5, nominalVoltage: 3.7 })).toThrow(RangeError);
      expect(() => energyDensity({ capacityAh: 5, nominalVoltage: -3.7 })).toThrow(RangeError);
      expect(() => energyDensity({ capacityAh: 0, nominalVoltage: 3.7 })).toThrow(RangeError);
    });

    it('refuses a given mass or volume that is not greater than 0', () => {
      expect(() => energyDensity({ capacityAh: 5, nominalVoltage: 3.7, massKg: 0 })).toThrow(RangeError);
      expect(() => energyDensity({ capacityAh: 5, nominalVoltage: 3.7, massKg: -0.1 })).toThrow(RangeError);
      expect(() => energyDensity({ capacityAh: 5, nominalVoltage: 3.7, volumeL: -0.025 })).toThrow(RangeError);
    });

    it('accepts a real cell: 5 Ah × 3.7 V = 18.5 Wh, omitted mass/volume → null', () => {
      const result = energyDensity({ capacityAh: 5, nominalVoltage: 3.7 });
      expect(result.energyWh).toBe(18.5);
      expect(result.gravimetricWhPerKg).toBeNull();
      expect(result.volumetricWhPerL).toBeNull();
      expect(energyDensity({ capacityAh: 5, nominalVoltage: 3.7, massKg: 0.074 }).gravimetricWhPerKg).toBe(250);
    });
  });

  describe('internalResistance', () => {
    it('refuses a negative voltage', () => {
      expect(() => internalResistance({ openCircuitVoltage: -4.2, loadVoltage: 4.1, loadCurrentA: 2 })).toThrow(RangeError);
      expect(() => internalResistance({ openCircuitVoltage: 4.2, loadVoltage: -4.1, loadCurrentA: 2 })).toThrow(RangeError);
    });

    it('accepts a load voltage of 0 (dead short): 4.2 V / 2 A = 2.1 Ω', () => {
      expect(internalResistance({ openCircuitVoltage: 4.2, loadVoltage: 0, loadCurrentA: 2 }).resistanceOhm).toBe(2.1);
    });
  });

  describe('selfDischarge', () => {
    it('refuses a non-positive voltage reading', () => {
      expect(() => selfDischarge({ initialVoltage: -4.2, finalVoltage: 4.1, days: 30, nominalVoltage: 3.7 })).toThrow(RangeError);
      expect(() => selfDischarge({ initialVoltage: 4.2, finalVoltage: -4.1, days: 30, nominalVoltage: 3.7 })).toThrow(RangeError);
      expect(() => selfDischarge({ initialVoltage: 4.2, finalVoltage: 0, days: 30, nominalVoltage: 3.7 })).toThrow(RangeError);
    });

    it('accepts a resting cell: 0.1 V over 30 days of 3.7 V nominal ≈ 2.7%/month', () => {
      expect(selfDischarge({ initialVoltage: 4.2, finalVoltage: 4.1, days: 30, nominalVoltage: 3.7 }).monthlyRatePercent).toBeCloseTo(2.7, 2);
    });
  });

  describe('stateOfHealth', () => {
    it('refuses a negative measured or non-positive rated capacity', () => {
      expect(() => stateOfHealth({ measuredCapacityAh: -1, ratedCapacityAh: 100 })).toThrow(RangeError);
      expect(() => stateOfHealth({ measuredCapacityAh: 80, ratedCapacityAh: -100 })).toThrow(RangeError);
    });

    it('accepts a measured capacity of 0 as a dead cell', () => {
      const result = stateOfHealth({ measuredCapacityAh: 0, ratedCapacityAh: 100 });
      expect(result.sohPercent).toBe(0);
      expect(result.status).toBe('endOfLife');
    });
  });

  describe('thermalRunaway', () => {
    it('refuses a negative internal resistance', () => {
      expect(() => thermalRunaway({ ambientTempC: 25, currentA: 10, internalResistanceOhm: -0.01, heatTransferCoeff: 10, surfaceAreaM2: 0.01, runawayTempC: 150 })).toThrow(RangeError);
    });

    it('accepts zero resistance and a sub-zero ambient: the cell sits at ambient', () => {
      const result = thermalRunaway({ ambientTempC: -20, currentA: 10, internalResistanceOhm: 0, heatTransferCoeff: 10, surfaceAreaM2: 0.01, runawayTempC: 150 });
      expect(result.temperatureRiseC).toBe(0);
      expect(result.steadyStateTempC).toBe(-20);
    });

    it('treats a signed (charging) current the same as its magnitude', () => {
      const charge = thermalRunaway({ ambientTempC: 25, currentA: -10, internalResistanceOhm: 0.01, heatTransferCoeff: 10, surfaceAreaM2: 0.01, runawayTempC: 150 });
      const discharge = thermalRunaway({ ambientTempC: 25, currentA: 10, internalResistanceOhm: 0.01, heatTransferCoeff: 10, surfaceAreaM2: 0.01, runawayTempC: 150 });
      expect(charge).toEqual(discharge);
      expect(charge.temperatureRiseC).toBe(10);
    });
  });
});

describe('readings that contradict each other', () => {
  it('internalResistance: a load voltage above the open-circuit voltage throws (negative resistance)', () => {
    expect(() => internalResistance({ openCircuitVoltage: 3.7, loadVoltage: 3.8, loadCurrentA: 10 })).toThrow(RangeError);
    expect(internalResistance({ openCircuitVoltage: 3.7, loadVoltage: 3.7, loadCurrentA: 10 }).resistanceOhm).toBe(0);
  });

  it('selfDischarge: a final voltage above the initial one throws (negative discharge)', () => {
    expect(() => selfDischarge({ initialVoltage: 3.7, finalVoltage: 3.8, days: 30, nominalVoltage: 3.7 })).toThrow(RangeError);
  });
});
