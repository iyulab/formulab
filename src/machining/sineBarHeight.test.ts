import { describe, it, expect } from 'vitest';
import { sineBarHeight } from './sineBarHeight.js';

describe('sineBarHeight', () => {
  it('should calculate exact height for 30° on 125mm sine bar', () => {
    const result = sineBarHeight({
      angle: 30,
      sineBarLength: 125,
    });

    // H = 125 × sin(30°) = 125 × 0.5 = 62.5
    expect(result.height).toBe(62.5);
    expect(result.roundedHeight).toBeUndefined();
  });

  it('should calculate exact height for 45° on 100mm sine bar', () => {
    const result = sineBarHeight({
      angle: 45,
      sineBarLength: 100,
    });

    // H = 100 × sin(45°) = 70.7107
    expect(result.height).toBeCloseTo(70.7107, 3);
  });

  it('should round to gauge block increment', () => {
    const result = sineBarHeight({
      angle: 30,
      sineBarLength: 125,
      roundToBlock: 0.001,
    });

    expect(result.height).toBe(62.5);
    expect(result.roundedHeight).toBe(62.5);
    expect(result.angleError).toBeCloseTo(0, 6);
  });

  it('should compute angle error when rounding changes height', () => {
    const result = sineBarHeight({
      angle: 15.5,
      sineBarLength: 100,
      roundToBlock: 0.5,
    });

    // H = 100 × sin(15.5°) = 26.7238...
    // Rounded to 0.5mm → 26.5
    expect(result.roundedHeight).toBe(26.5);
    // actualAngle = arcsin(26.5/100) ≈ 15.3682°
    expect(result.actualAngle).toBeDefined();
    expect(result.angleError).toBeDefined();
    // Error should be small but nonzero
    expect(Math.abs(result.angleError!)).toBeLessThan(0.5);
  });

  it('should calculate for 0° angle', () => {
    const result = sineBarHeight({
      angle: 0,
      sineBarLength: 100,
    });

    expect(result.height).toBe(0);
  });

  it('should calculate for 90° angle', () => {
    const result = sineBarHeight({
      angle: 90,
      sineBarLength: 250,
    });

    expect(result.height).toBe(250);
  });
});
