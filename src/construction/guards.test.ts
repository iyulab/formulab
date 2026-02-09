import { describe, it, expect } from 'vitest';
import { isMomentOfInertiaInput } from './guards.js';

describe('isMomentOfInertiaInput', () => {
  it('accepts rectangle', () => {
    expect(isMomentOfInertiaInput({ shape: 'rectangle', width: 100, height: 200 })).toBe(true);
  });

  it('accepts circle', () => {
    expect(isMomentOfInertiaInput({ shape: 'circle', diameter: 150 })).toBe(true);
  });

  it('accepts hollowRectangle', () => {
    expect(isMomentOfInertiaInput({
      shape: 'hollowRectangle', outerWidth: 100, outerHeight: 200, innerWidth: 80, innerHeight: 180,
    })).toBe(true);
  });

  it('accepts hollowCircle', () => {
    expect(isMomentOfInertiaInput({ shape: 'hollowCircle', outerDiameter: 100, innerDiameter: 80 })).toBe(true);
  });

  it('accepts iBeam', () => {
    expect(isMomentOfInertiaInput({
      shape: 'iBeam', flangeWidth: 150, totalHeight: 300, webThickness: 10, flangeThickness: 15,
    })).toBe(true);
  });

  it('accepts tSection', () => {
    expect(isMomentOfInertiaInput({
      shape: 'tSection', flangeWidth: 150, flangeThickness: 15, webThickness: 10, webHeight: 200,
    })).toBe(true);
  });

  it('accepts cChannel', () => {
    expect(isMomentOfInertiaInput({
      shape: 'cChannel', flangeWidth: 80, totalHeight: 200, webThickness: 8, flangeThickness: 12,
    })).toBe(true);
  });

  it('rejects null', () => {
    expect(isMomentOfInertiaInput(null)).toBe(false);
  });

  it('rejects invalid shape', () => {
    expect(isMomentOfInertiaInput({ shape: 'hexagon', width: 100 })).toBe(false);
  });

  it('rejects rectangle missing width', () => {
    expect(isMomentOfInertiaInput({ shape: 'rectangle', height: 200 })).toBe(false);
  });

  it('rejects circle missing diameter', () => {
    expect(isMomentOfInertiaInput({ shape: 'circle' })).toBe(false);
  });

  it('rejects iBeam missing field', () => {
    expect(isMomentOfInertiaInput({
      shape: 'iBeam', flangeWidth: 150, totalHeight: 300, webThickness: 10,
    })).toBe(false);
  });

  it('rejects empty object', () => {
    expect(isMomentOfInertiaInput({})).toBe(false);
  });

  it('rejects primitive values', () => {
    expect(isMomentOfInertiaInput('rectangle')).toBe(false);
    expect(isMomentOfInertiaInput(42)).toBe(false);
  });
});
