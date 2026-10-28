import { describe, it, expect } from 'vitest';
import { cutting } from './cutting.js';
import { cuttingStock } from './cuttingStock.js';
import { flatPattern } from './flatPattern.js';
import { metalWeight } from './metalWeight.js';
import { pressFit } from './pressFit.js';
import { pressTonnage } from './pressTonnage.js';

// A negative physical quantity has no meaning; returning a sign-flipped "result" for it presents
// garbage as a calculation. Each function refuses it, and accepts the domain boundary.
describe('metal: physical input domains', () => {
  it('cutting refuses non-positive speeds, feeds, depths, widths and teeth the operation reads', () => {
    expect(() => cutting({ operation: 'turning', cuttingSpeed: -100, toolDiameter: 10, feedPerRev: 0.2, depthOfCut: 2 })).toThrow(RangeError);
    expect(() => cutting({ operation: 'turning', cuttingSpeed: 100, toolDiameter: 10, feedPerRev: 0.2, depthOfCut: -2 })).toThrow(RangeError);
    expect(() => cutting({ operation: 'milling', cuttingSpeed: 100, toolDiameter: 10, feedPerTooth: 0.1, numberOfTeeth: -4, depthOfCut: 2, widthOfCut: 5 })).toThrow(RangeError);
    expect(() => cutting({ operation: 'drilling', cuttingSpeed: 100, toolDiameter: 10, feedPerRev: -0.1 })).toThrow(RangeError);
    // Omitted feed: spindle speed only. RPM = 1000 × 100 / (π × 10) ≈ 3183
    const r = cutting({ operation: 'turning', cuttingSpeed: 100, toolDiameter: 10 });
    expect(r.rpm).toBe(3183);
    expect(r.feedRate).toBe(0);
  });

  it('cuttingStock refuses a negative kerf or a non-positive piece length and accepts kerf 0', () => {
    expect(() => cuttingStock({ stockLength: 1000, kerf: -3, pieces: [{ length: 500, quantity: 2 }], algorithm: 'ffd' })).toThrow(RangeError);
    expect(() => cuttingStock({ stockLength: 1000, kerf: 3, pieces: [{ length: -100, quantity: 2 }], algorithm: 'bfd' })).toThrow(RangeError);
    const r = cuttingStock({ stockLength: 1000, kerf: 0, pieces: [{ length: 500, quantity: 2 }], algorithm: 'ffd' });
    expect(r.stocksUsed).toBe(1);
    expect(r.totalWaste).toBe(0);
  });

  it('flatPattern refuses flanges shorter than the bend deduction', () => {
    // BD = 2 × (2 + 2)·tan45° − π/2 × (2 + 0.44 × 2) ≈ 3.476 > 1 + 1
    expect(() => flatPattern({ shapeType: 'lShape', thickness: 2, bendAngle: 90, insideRadius: 2, flangeA: 1, flangeB: 1 })).toThrow(RangeError);
    const r = flatPattern({ shapeType: 'lShape', thickness: 2, bendAngle: 90, insideRadius: 2, flangeA: 50, flangeB: 30 });
    expect(r.flatLength).toBeCloseTo(76.524, 2);
  });

  it('metalWeight refuses a non-positive dimension and an angle thicker than its legs', () => {
    expect(() => metalWeight({ shape: 'plate', materialName: 'steel', length: 1000, width: 100, thickness: -2 })).toThrow(RangeError);
    expect(() => metalWeight({ shape: 'angle', materialName: 'steel', length: 1000, width: 10, height: 10, thickness: 30 })).toThrow(RangeError);
    // thickness = width: area = 10·10 + 50·10 − 10² = 500 mm² → 500 cm³ × 7.85 = 3.925 kg
    const r = metalWeight({ shape: 'angle', materialName: 'steel', length: 1000, width: 10, height: 50, thickness: 10 });
    expect(r.weight).toBe(3.925);
  });

  it('pressFit refuses a non-positive Young\'s modulus or friction coefficient', () => {
    expect(() => pressFit({ shaftDiameter: 25.05, holeDiameter: 25, hubOuterDiameter: 50, contactLength: 30, youngsModulus: -200, frictionCoefficient: 0.15 })).toThrow(RangeError);
    expect(() => pressFit({ shaftDiameter: 25.05, holeDiameter: 25, hubOuterDiameter: 50, contactLength: 30, youngsModulus: 200, frictionCoefficient: 0 })).toThrow(RangeError);
    expect(() => pressFit({ shaftDiameter: -25.05, holeDiameter: 25, hubOuterDiameter: 50, contactLength: 30, youngsModulus: 200, frictionCoefficient: 0.15 })).toThrow(RangeError);
    // No hub wall: the hub OD does not clear the shaft / the bore
    expect(() => pressFit({ shaftDiameter: 50, holeDiameter: 49.95, hubOuterDiameter: 50, contactLength: 30, youngsModulus: 200, frictionCoefficient: 0.15 })).toThrow(RangeError);
    expect(() => pressFit({ shaftDiameter: 24.95, holeDiameter: 25, hubOuterDiameter: 24.98, contactLength: 30, youngsModulus: 200, frictionCoefficient: 0.15 })).toThrow(RangeError);
    const r = pressFit({ shaftDiameter: 25.05, holeDiameter: 25, hubOuterDiameter: 50, contactLength: 30, youngsModulus: 200, frictionCoefficient: 0.15 });
    expect(r.interference).toBeCloseTo(0.05, 3);
    expect(r.assemblyForce).toBeGreaterThan(0);
  });

  it('pressTonnage refuses non-positive dimensions, strengths and factors', () => {
    expect(() => pressTonnage({ operation: 'bending', thickness: 2, tensileStrength: -400, shearStrength: 300, bendLength: 1000 })).toThrow(RangeError);
    expect(() => pressTonnage({ operation: 'blanking', thickness: 2, tensileStrength: 400, shearStrength: 300, cuttingPerimeter: -200 })).toThrow(RangeError);
    expect(() => pressTonnage({ operation: 'blanking', thickness: 2, tensileStrength: 400, shearStrength: 300, cuttingPerimeter: 200, safetyFactor: 0 })).toThrow(RangeError);
    expect(() => pressTonnage({ operation: 'drawing', thickness: 1, tensileStrength: 400, shearStrength: 300, punchDiameter: 100, blankDiameter: 80 })).toThrow(RangeError);
    expect(() => pressTonnage({ operation: 'drawing', thickness: 1, tensileStrength: 400, shearStrength: 300, punchDiameter: 100, drawRatio: 1.2 })).toThrow(RangeError);
    // No blank holder (pressure 0) is a valid shallow draw
    const r = pressTonnage({ operation: 'drawing', thickness: 1, tensileStrength: 400, shearStrength: 300, punchDiameter: 100, blankDiameter: 150, blankHolderPressure: 0 });
    expect(r.blankHolderForce).toBe(0);
    expect(r.drawingForce).toBeGreaterThan(0);
  });
});
