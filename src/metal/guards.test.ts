import { describe, it, expect } from 'vitest';
import { isMetalWeightInput, isBoltInput } from './guards.js';

describe('isMetalWeightInput', () => {
  it('accepts plate', () => {
    expect(isMetalWeightInput({ shape: 'plate', materialName: 'steel', length: 1000, width: 500, thickness: 10 })).toBe(true);
  });

  it('accepts round', () => {
    expect(isMetalWeightInput({ shape: 'round', materialName: 'aluminum', length: 1000, diameter: 50 })).toBe(true);
  });

  it('accepts pipe', () => {
    expect(isMetalWeightInput({ shape: 'pipe', materialName: 'copper', length: 1000, outerDiameter: 50, innerDiameter: 40 })).toBe(true);
  });

  it('accepts angle', () => {
    expect(isMetalWeightInput({ shape: 'angle', materialName: 'steel', length: 1000, width: 50, height: 50, thickness: 5 })).toBe(true);
  });

  it('rejects null', () => {
    expect(isMetalWeightInput(null)).toBe(false);
  });

  it('rejects missing length', () => {
    expect(isMetalWeightInput({ shape: 'plate', materialName: 'steel', width: 500, thickness: 10 })).toBe(false);
  });

  it('rejects missing materialName', () => {
    expect(isMetalWeightInput({ shape: 'plate', length: 1000, width: 500, thickness: 10 })).toBe(false);
  });

  it('rejects non-string materialName', () => {
    expect(isMetalWeightInput({ shape: 'plate', materialName: 123, length: 1000, width: 500, thickness: 10 })).toBe(false);
  });

  it('rejects invalid shape', () => {
    expect(isMetalWeightInput({ shape: 'hexagon', materialName: 'steel', length: 1000 })).toBe(false);
  });

  it('rejects plate missing width', () => {
    expect(isMetalWeightInput({ shape: 'plate', materialName: 'steel', length: 1000, thickness: 10 })).toBe(false);
  });

  it('rejects pipe missing innerDiameter', () => {
    expect(isMetalWeightInput({ shape: 'pipe', materialName: 'steel', length: 1000, outerDiameter: 50 })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(isMetalWeightInput({})).toBe(false);
  });
});

describe('isBoltInput', () => {
  it('accepts torqueToPreload', () => {
    expect(isBoltInput({
      mode: 'torqueToPreload', diameter: 10, pitch: 1.5, kFactor: 0.2, tensileStrength: 800, torque: 50,
    })).toBe(true);
  });

  it('accepts preloadToTorque', () => {
    expect(isBoltInput({
      mode: 'preloadToTorque', diameter: 10, pitch: 1.5, kFactor: 0.2, tensileStrength: 800, preload: 25,
    })).toBe(true);
  });

  it('rejects null', () => {
    expect(isBoltInput(null)).toBe(false);
  });

  it('rejects missing base field diameter', () => {
    expect(isBoltInput({
      mode: 'torqueToPreload', pitch: 1.5, kFactor: 0.2, tensileStrength: 800, torque: 50,
    })).toBe(false);
  });

  it('rejects missing base field pitch', () => {
    expect(isBoltInput({
      mode: 'torqueToPreload', diameter: 10, kFactor: 0.2, tensileStrength: 800, torque: 50,
    })).toBe(false);
  });

  it('rejects invalid mode', () => {
    expect(isBoltInput({
      mode: 'invalid', diameter: 10, pitch: 1.5, kFactor: 0.2, tensileStrength: 800, torque: 50,
    })).toBe(false);
  });

  it('rejects torqueToPreload missing torque', () => {
    expect(isBoltInput({
      mode: 'torqueToPreload', diameter: 10, pitch: 1.5, kFactor: 0.2, tensileStrength: 800,
    })).toBe(false);
  });

  it('rejects preloadToTorque missing preload', () => {
    expect(isBoltInput({
      mode: 'preloadToTorque', diameter: 10, pitch: 1.5, kFactor: 0.2, tensileStrength: 800,
    })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(isBoltInput({})).toBe(false);
  });
});
