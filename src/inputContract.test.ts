import { describe, expect, it } from 'vitest';
import { requireFinite } from './utils.js';
import { arcFlash } from './safety/arcFlash.js';
import { concentration } from './chemical/concentration.js';
import { flowControl } from './chemical/flowControl.js';
import { reliefValve } from './chemical/reliefValve.js';
import { ledRoi } from './energy/ledRoi.js';
import { illuminance } from './safety/illuminance.js';
import { cuttingStock } from './metal/cuttingStock.js';
import { flatPattern } from './metal/flatPattern.js';
import { bendAllowance } from './metal/bendAllowance.js';
import { metalWeight } from './metal/metalWeight.js';
import { bmsBalancing } from './battery/bmsBalancing.js';
import { gageRR } from './quality/gageRR.js';
import type { ConcentrationInput, FlowControlInput, ReliefValveInput } from './chemical/types.js';
import type { FlatPatternInput, MetalWeightInput } from './metal/types.js';
import type { BmsBalancingInput } from './battery/types.js';
import type { IlluminanceInput } from './safety/types.js';

describe('requireFinite — the library-wide input contract', () => {
  it('names the path of the first non-finite number, nested in objects and arrays', () => {
    expect(() => requireFinite('f', { a: 1, b: [2, { c: NaN }] })).toThrow('f: b[1].c must be a finite number (got NaN)');
    expect(() => requireFinite('f', [1, Infinity])).toThrow('f: [1] must be a finite number (got Infinity)');
    expect(() => requireFinite('f', -Infinity)).toThrow('f: input must be a finite number (got -Infinity)');
  });

  it('leaves strings, booleans, null and undefined to the function', () => {
    expect(() => requireFinite('f', { s: 'x', b: true, n: null, u: undefined, v: 0 })).not.toThrow();
  });

  it('closes the class the 2026-10 audit found: no verdict beside a NaN input', () => {
    // Before: incidentEnergy null with PPE category 4 and «extreme».
    expect(() =>
      arcFlash({
        voltage: 480,
        boltedFaultCurrent: NaN,
        workingDistance: 455,
        faultClearingTime: 0.2,
        gapBetweenConductors: 32,
        electrodeConfig: 'VCB',
        enclosureType: 'box',
      } as Parameters<typeof arcFlash>[0]),
    ).toThrow(/boltedFaultCurrent must be a finite number/);
  });
});

describe('range checks (0.58.0)', () => {
  it('concentration refuses more solute than solution', () => {
    const base: Omit<ConcentrationInput, 'fromUnit' | 'value'> = { molecularWeight: 58.44, solutionDensity: 1.0 };
    expect(() => concentration({ ...base, fromUnit: 'wtPercent', value: 101 })).toThrow(/at most 100 wt%/);
    expect(() => concentration({ ...base, fromUnit: 'ppm', value: 1_000_001 })).toThrow(/at most 100 wt%/);
    expect(() => concentration({ ...base, fromUnit: 'molPerL', value: 20 })).toThrow(/at most 100 wt%/);
    expect(concentration({ ...base, fromUnit: 'wtPercent', value: 100 }).ppm).toBe(1_000_000);
  });

  it('flowControl refuses a negative absolute outlet pressure', () => {
    const input = { flowRate: 10, inletPressure: 500, outletPressure: -10, fluidDensity: 1.2, fluidType: 'gas' } as FlowControlInput;
    expect(() => flowControl(input)).toThrow(/outletPressure must not be negative/);
    expect(() => flowControl({ ...input, outletPressure: 0 })).not.toThrow();
  });

  it('reliefValve refuses gas below absolute zero and a negative overpressure', () => {
    const gas = { requiredCapacity: 1000, setPressure: 500, backPressure: 0, temperature: -300, fluidType: 'gas' } as ReliefValveInput;
    expect(() => reliefValve(gas)).toThrow(/absolute zero/);
    expect(() => reliefValve({ ...gas, temperature: 20, overpressure: -5 })).toThrow(/overpressure must not be negative/);
  });

  it('ledRoi refuses an old fixture that draws nothing', () => {
    const input = { fixtureCount: 10, oldWatts: 0, newWatts: 20, operatingHours: 4000, electricityRate: 0.15, fixtureCost: 30, installationCost: 0, co2Factor: 0.4 };
    expect(() => ledRoi(input)).toThrow(/oldWatts must be greater than 0/);
  });

  it('illuminance refuses a workplane below the floor', () => {
    const input = { roomLength: 10, roomWidth: 8, luminaireHeight: 3, workplaneHeight: -0.5, targetLux: 500, lumensPerLuminaire: 4000 } as IlluminanceInput;
    expect(() => illuminance(input)).toThrow(/workplaneHeight must not be negative/);
    expect(() => illuminance({ ...input, workplaneHeight: 0 })).not.toThrow();
  });

  it('cuttingStock refuses a piece quantity that is not a whole number above 0', () => {
    const run = (quantity: number) => cuttingStock({ stockLength: 6000, kerf: 3, pieces: [{ length: 1000, quantity: 2 }, { length: 500, quantity }] });
    expect(() => run(0)).toThrow(/pieces\[1\]\.quantity must be a whole number greater than 0/);
    expect(() => run(-1)).toThrow(/pieces\[1\]\.quantity/);
    expect(() => run(2.5)).toThrow(/pieces\[1\]\.quantity/);
    expect(() => run(1)).not.toThrow();
  });

  it('flatPattern and bendAllowance name the field: unknown shape or material', () => {
    const base = { shapeType: 'lShape', thickness: 2, bendAngle: 90, insideRadius: 2, flangeA: 50, flangeB: 50 } as FlatPatternInput;
    expect(() => flatPattern({ ...base, shapeType: 'zShape' } as unknown as FlatPatternInput)).toThrow(/shapeType must be lShape or uShape/);
    expect(() => flatPattern({ ...base, material: 'unobtanium' } as unknown as FlatPatternInput)).toThrow(/material must be one of/);
    expect(() => flatPattern({ ...base, material: 'unobtanium', kFactor: 0.4 } as unknown as FlatPatternInput)).not.toThrow();
    expect(() =>
      bendAllowance({ thickness: 2, bendAngle: 90, insideRadius: 2, material: 'unobtanium' } as unknown as Parameters<typeof bendAllowance>[0]),
    ).toThrow(/material must be one of/);
  });

  it('metalWeight refuses an unknown material or shape instead of an empty weight', () => {
    const plate = { shape: 'plate', materialName: 'steel', length: 1000, width: 100, thickness: 10 } as MetalWeightInput;
    expect(() => metalWeight({ ...plate, materialName: 'unobtanium' } as unknown as MetalWeightInput)).toThrow(/materialName must be one of/);
    expect(() => metalWeight({ ...plate, shape: 'hexagon' } as unknown as MetalWeightInput)).toThrow(/shape must be plate, round, pipe, or angle/);
  });

  it('bmsBalancing needs at least two cells to balance', () => {
    const input = { balancingCurrentMA: 100, cellCapacityAh: 3 } as Omit<BmsBalancingInput, 'cellVoltages'>;
    expect(() => bmsBalancing({ ...input, cellVoltages: [3.7] })).toThrow(/at least 2 cells/);
    expect(() => bmsBalancing(input as BmsBalancingInput)).toThrow(/at least 2 cells/);
  });
});

describe('range checks (0.59.0)', () => {
  it('gageRR refuses a tolerance given as 0 or less instead of ignoring it', () => {
    const measurements = [
      [[1, 1.1], [1.05, 1.0]],
      [[2, 2.1], [2.05, 1.95]],
    ];
    expect(() => gageRR({ measurements, tolerance: 0 })).toThrow(/tolerance must be greater than 0/);
    expect(() => gageRR({ measurements, tolerance: -1 })).toThrow(/tolerance must be greater than 0/);
    expect(gageRR({ measurements, tolerance: 1 }).percentTolerance).not.toBeNull();
  });

  it('ledRoi refuses a replacement that draws nothing', () => {
    const input = { fixtureCount: 10, oldWatts: 60, newWatts: 0, operatingHours: 4000, electricityRate: 0.15, fixtureCost: 30, installationCost: 0, co2Factor: 0.4 };
    expect(() => ledRoi(input)).toThrow(/newWatts must be greater than 0/);
  });

  it('reliefValve refuses a liquid below absolute zero too', () => {
    const liquid = { requiredCapacity: 100, setPressure: 500, backPressure: 0, temperature: -300, fluidType: 'liquid' } as ReliefValveInput;
    expect(() => reliefValve(liquid)).toThrow(/absolute zero/);
    expect(() => reliefValve({ ...liquid, temperature: 20 })).not.toThrow();
  });
});
