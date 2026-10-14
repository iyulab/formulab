import { describe, it, expect } from 'vitest';
import { batch } from './batch.js';
import { concentration } from './concentration.js';
import { dilution } from './dilution.js';
import { flowControl } from './flowControl.js';
import { injectionCycle } from './injectionCycle.js';
import { ph } from './ph.js';
import { reactor } from './reactor.js';
import { reliefValve } from './reliefValve.js';
import { shelfLife } from './shelfLife.js';

// A negative physical quantity used to come back as a sign-flipped "result"; each is refused now.
describe('chemical physical-input domains', () => {
  describe('batch', () => {
    it('refuses a negative ingredient amount', () => {
      expect(() => batch({ originalBatchSize: 100, targetBatchSize: 200, ingredients: [{ name: 'Flour', amount: -500, unit: 'g' }] })).toThrow(RangeError);
    });

    it('accepts a zero amount', () => {
      expect(batch({ originalBatchSize: 100, targetBatchSize: 200, ingredients: [{ name: 'Salt', amount: 0, unit: 'g' }] }).scaledIngredients[0].scaledAmount).toBe(0);
    });
  });

  describe('concentration', () => {
    it('refuses a negative value', () => {
      expect(() => concentration({ fromUnit: 'molPerL', value: -1, molecularWeight: 58.44, solutionDensity: 1.04 })).toThrow(RangeError);
      expect(() => concentration({ fromUnit: 'ppm', value: -100, molecularWeight: 58.44, solutionDensity: 1.04 })).toThrow(RangeError);
    });

    it('refuses an unknown unit instead of a zero-filled result', () => {
      expect(() => concentration({ fromUnit: 'molality' as never, value: 1, molecularWeight: 58.44, solutionDensity: 1.04 })).toThrow(RangeError);
    });

    it('accepts zero (pure solvent)', () => {
      expect(concentration({ fromUnit: 'wtPercent', value: 0, molecularWeight: 58.44, solutionDensity: 1.04 })).toEqual({ molPerL: 0, wtPercent: 0, ppm: 0 });
    });
  });

  describe('dilution', () => {
    it('refuses a non-positive given concentration or volume', () => {
      expect(() => dilution({ solveFor: 'c2', c1: -10, v1: 100, v2: 500 })).toThrow(RangeError);
      expect(() => dilution({ solveFor: 'v2', c1: 50, v1: -200, c2: 10 })).toThrow(RangeError);
      expect(() => dilution({ solveFor: 'c1', v1: 100, c2: -5, v2: 400 })).toThrow(RangeError);
      expect(() => dilution({ solveFor: 'v1', c1: 30, c2: 6, v2: -500 })).toThrow(RangeError);
    });

    it('accepts positive values: 10 × 100 / 500 = 2', () => {
      expect(dilution({ solveFor: 'c2', c1: 10, v1: 100, v2: 500 }).c2).toBe(2);
    });
  });

  describe('flowControl', () => {
    it('refuses a negative flow rate', () => {
      expect(() => flowControl({ flowRate: -10, inletPressure: 500, outletPressure: 300, fluidDensity: 999, fluidType: 'liquid' })).toThrow(RangeError);
    });

    it('refuses zero flow — there is no flow to size the valve for', () => {
      expect(() => flowControl({ flowRate: 0, inletPressure: 500, outletPressure: 300, fluidDensity: 999, fluidType: 'liquid' })).toThrow(/flowRate must be greater than 0/);
    });
  });

  describe('injectionCycle', () => {
    it('refuses a negative shot weight or phase time', () => {
      expect(() => injectionCycle({ resin: 'abs', wallThickness: 3, shotWeight: -50 })).toThrow(RangeError);
      expect(() => injectionCycle({ resin: 'abs', wallThickness: 3, shotWeight: 50, moldOpenCloseTime: -3 })).toThrow(RangeError);
      expect(() => injectionCycle({ resin: 'abs', wallThickness: 3, shotWeight: 50, ejectionTime: -0.5 })).toThrow(RangeError);
    });

    it('refuses a non-positive wall thickness', () => {
      expect(() => injectionCycle({ resin: 'abs', wallThickness: -3, shotWeight: 50 })).toThrow(RangeError);
      expect(() => injectionCycle({ resin: 'abs', wallThickness: 0, shotWeight: 50 })).toThrow(RangeError);
    });

    it('refuses a shot with no material — a cycle rate for it is a rate for no parts', () => {
      expect(() => injectionCycle({ resin: 'abs', wallThickness: 3, shotWeight: 0 })).toThrow(/shotWeight must be greater than 0/);
    });

    it('accepts zero handling times', () => {
      const result = injectionCycle({ resin: 'abs', wallThickness: 3, shotWeight: 50, moldOpenCloseTime: 0, ejectionTime: 0 });
      expect(result.totalCycleTime).toBeCloseTo(result.fillTime + result.coolingTime + result.packingTime, 1);
    });
  });

  describe('ph', () => {
    it('refuses a non-positive or NaN acid concentration', () => {
      expect(() => ph({ bufferSystem: 'acetate', acidConcentration: -0.1, baseConcentration: 0.1, temperature: 25 })).toThrow(RangeError);
      expect(() => ph({ bufferSystem: 'acetate', acidConcentration: NaN, baseConcentration: 0.1, temperature: 25 })).toThrow(RangeError);
    });

    it('accepts a negative custom pKa (strong acid): pH = pKa at equal concentrations', () => {
      expect(ph({ bufferSystem: 'custom', customPka: -2, acidConcentration: 0.1, baseConcentration: 0.1, temperature: 25 }).pH).toBe(-2);
    });
  });

  describe('reactor', () => {
    it('refuses a fill ratio outside (0, 1]', () => {
      expect(() => reactor({ shape: 'cylindrical', diameter: 1, height: 2, fillRatio: -0.8 })).toThrow(RangeError);
      expect(() => reactor({ shape: 'spherical', diameter: 1, fillRatio: 1.2 })).toThrow(RangeError);
    });

    it('accepts fillRatio = 1: working volume is the whole vessel', () => {
      const result = reactor({ shape: 'cylindrical', diameter: 1, height: 2, fillRatio: 1 });
      expect(result.workingVolume).toBeCloseTo(1.5708, 4);
      expect(result.workingVolume).toBe(result.totalVolume);
    });
  });

  describe('reliefValve', () => {
    it('refuses a non-positive required capacity', () => {
      expect(() => reliefValve({ requiredCapacity: -5000, setPressure: 1000, backPressure: 101, temperature: 100, fluidType: 'gas', molecularWeight: 29 })).toThrow(RangeError);
      expect(() => reliefValve({ requiredCapacity: 0, setPressure: 1000, backPressure: 101, temperature: 100, fluidType: 'gas', molecularWeight: 29 })).toThrow(RangeError);
    });

    it('accepts a small positive capacity and picks the smallest orifice', () => {
      const result = reliefValve({ requiredCapacity: 1, setPressure: 1000, backPressure: 101, temperature: 100, fluidType: 'gas', molecularWeight: 29 });
      expect(result.requiredArea).toBeGreaterThan(0);
      expect(result.selectedOrifice).toBe('D');
    });
  });

  describe('shelfLife', () => {
    it('refuses a non-positive reference shelf life', () => {
      expect(() => shelfLife({ shelfLifeAtRef: -30, refTemp: 25, targetTemp: 15, q10: 2 })).toThrow(RangeError);
      expect(() => shelfLife({ shelfLifeAtRef: 0, refTemp: 25, targetTemp: 15, q10: 2 })).toThrow(RangeError);
    });

    it('accepts a sub-zero target temperature: 30 days × 2^3 = 240', () => {
      expect(shelfLife({ shelfLifeAtRef: 30, refTemp: 25, targetTemp: -5, q10: 2 }).estimatedShelfLife).toBe(240);
    });
  });
});
