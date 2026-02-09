import { describe, it, expect } from 'vitest';
import { isDilutionInput, isReactorInput, isHeatTransferInput } from './guards.js';

describe('isDilutionInput', () => {
  it('accepts valid solveFor=c1', () => {
    expect(isDilutionInput({ solveFor: 'c1', v1: 100, c2: 0.5, v2: 200 })).toBe(true);
  });

  it('accepts valid solveFor=v1', () => {
    expect(isDilutionInput({ solveFor: 'v1', c1: 1.0, c2: 0.5, v2: 200 })).toBe(true);
  });

  it('accepts valid solveFor=c2', () => {
    expect(isDilutionInput({ solveFor: 'c2', c1: 1.0, v1: 100, v2: 200 })).toBe(true);
  });

  it('accepts valid solveFor=v2', () => {
    expect(isDilutionInput({ solveFor: 'v2', c1: 1.0, v1: 100, c2: 0.5 })).toBe(true);
  });

  it('rejects null', () => {
    expect(isDilutionInput(null)).toBe(false);
  });

  it('rejects invalid solveFor', () => {
    expect(isDilutionInput({ solveFor: 'invalid', c1: 1, v1: 1, c2: 1 })).toBe(false);
  });

  it('rejects missing required field for c1 variant', () => {
    expect(isDilutionInput({ solveFor: 'c1', v1: 100, c2: 0.5 })).toBe(false);
  });

  it('rejects non-number field', () => {
    expect(isDilutionInput({ solveFor: 'c1', v1: '100', c2: 0.5, v2: 200 })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(isDilutionInput({})).toBe(false);
  });
});

describe('isReactorInput', () => {
  it('accepts valid cylindrical reactor', () => {
    expect(isReactorInput({ shape: 'cylindrical', diameter: 2, fillRatio: 0.8, height: 5 })).toBe(true);
  });

  it('accepts valid spherical reactor', () => {
    expect(isReactorInput({ shape: 'spherical', diameter: 2, fillRatio: 0.8 })).toBe(true);
  });

  it('rejects null', () => {
    expect(isReactorInput(null)).toBe(false);
  });

  it('rejects missing diameter', () => {
    expect(isReactorInput({ shape: 'spherical', fillRatio: 0.8 })).toBe(false);
  });

  it('rejects missing fillRatio', () => {
    expect(isReactorInput({ shape: 'spherical', diameter: 2 })).toBe(false);
  });

  it('rejects cylindrical without height', () => {
    expect(isReactorInput({ shape: 'cylindrical', diameter: 2, fillRatio: 0.8 })).toBe(false);
  });

  it('rejects invalid shape', () => {
    expect(isReactorInput({ shape: 'conical', diameter: 2, fillRatio: 0.8 })).toBe(false);
  });

  it('accepts optional agitatorType', () => {
    expect(isReactorInput({ shape: 'spherical', diameter: 2, fillRatio: 0.8, agitatorType: 'turbine' })).toBe(true);
  });
});

describe('isHeatTransferInput', () => {
  it('accepts valid conduction input', () => {
    expect(isHeatTransferInput({
      mode: 'conduction', conductivity: 50, area: 2, thickness: 0.01, tempHot: 100, tempCold: 25,
    })).toBe(true);
  });

  it('accepts valid convection input', () => {
    expect(isHeatTransferInput({
      mode: 'convection', coefficient: 25, area: 2, tempSurface: 80, tempFluid: 20,
    })).toBe(true);
  });

  it('accepts valid radiation input', () => {
    expect(isHeatTransferInput({
      mode: 'radiation', emissivity: 0.9, area: 2, tempHot: 500, tempCold: 25,
    })).toBe(true);
  });

  it('rejects null', () => {
    expect(isHeatTransferInput(null)).toBe(false);
  });

  it('rejects invalid mode', () => {
    expect(isHeatTransferInput({ mode: 'unknown', area: 2 })).toBe(false);
  });

  it('rejects conduction missing conductivity', () => {
    expect(isHeatTransferInput({
      mode: 'conduction', area: 2, thickness: 0.01, tempHot: 100, tempCold: 25,
    })).toBe(false);
  });

  it('rejects convection missing coefficient', () => {
    expect(isHeatTransferInput({
      mode: 'convection', area: 2, tempSurface: 80, tempFluid: 20,
    })).toBe(false);
  });

  it('rejects radiation missing emissivity', () => {
    expect(isHeatTransferInput({
      mode: 'radiation', area: 2, tempHot: 500, tempCold: 25,
    })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(isHeatTransferInput({})).toBe(false);
  });
});
