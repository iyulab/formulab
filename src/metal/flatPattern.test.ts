import { describe, it, expect } from 'vitest';
import { flatPattern } from './flatPattern.js';
import { bendAllowance } from './bendAllowance.js';
import { kFactorReverse } from './kFactorReverse.js';

describe('flatPattern', () => {
  // Golden guard. flatPattern shares the BA/OSSB/BD machinery with bendAllowance
  // and is inverted by kFactorReverse, so it can be pinned three independent ways:
  // a hand-worked value, agreement with bendAllowance, and a K round-trip. The
  // existing tests were mostly qualitative (>0, comparative), which cannot catch an
  // L-vs-U deduction slip (one BD vs two).
  //
  // mildSteel (K=0.44), T=2, R=3, 90deg:
  //   BA = (pi/2)(3 + 0.44*2) = 6.0947 ; OSSB = (3+2)tan45 = 5 ; BD = 2*5 - 6.0947 = 3.9053
  //   L-shape (A=50,B=30):     flat = 80  - 3.9053  = 76.0947
  //   U-shape (A=50,B=30,C=40): flat = 120 - 2*3.9053 = 112.1894  (two bends)
  describe('golden values (hand-worked + cross-checks)', () => {
    const common = { thickness: 2, bendAngle: 90, insideRadius: 3, material: 'mildSteel' as const };

    it('should match the hand-worked L-shape and U-shape flat lengths', () => {
      const l = flatPattern({ ...common, shapeType: 'lShape', flangeA: 50, flangeB: 30 });
      expect(l.bendAllowance).toBeCloseTo(6.0947, 3);
      expect(l.bendDeduction).toBeCloseTo(3.9053, 3);
      expect(l.flatLength).toBeCloseTo(76.0947, 3);

      const u = flatPattern({ ...common, shapeType: 'uShape', flangeA: 50, flangeB: 30, flangeC: 40 });
      expect(u.flatLength).toBeCloseTo(112.1894, 3); // two bend deductions
    });

    it('should agree with bendAllowance on BA and BD', () => {
      const fp = flatPattern({ ...common, shapeType: 'lShape', flangeA: 50, flangeB: 30 });
      const ba = bendAllowance({ thickness: 2, bendAngle: 90, insideRadius: 3, kFactor: 0.44 });
      expect(fp.bendAllowance).toBeCloseTo(ba.bendAllowance, 9);
      expect(fp.bendDeduction).toBeCloseTo(ba.bendDeduction, 9);
    });

    it('should round-trip through kFactorReverse (L-shape)', () => {
      const fp = flatPattern({ ...common, shapeType: 'lShape', flangeA: 50, flangeB: 30 });
      const back = kFactorReverse({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        measuredFlatLength: fp.flatLength,
        legA: 50,
        legB: 30,
      });
      expect(back.kFactor).toBeCloseTo(0.44, 9);
    });
  });

  describe('L-shape calculations', () => {
    it('should calculate flat length for L-shape bend', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.flatLength).toBeGreaterThan(0);
      expect(result.flatLength).toBeLessThan(50 + 30); // Less than sum of flanges
    });

    it('should increase flat length with larger flanges', () => {
      const small = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 30,
        flangeB: 20,
      });

      const large = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 60,
        flangeB: 40,
      });

      expect(large.flatLength).toBeGreaterThan(small.flatLength);
    });
  });

  describe('U-shape calculations', () => {
    it('should calculate flat length for U-shape (two bends)', () => {
      const result = flatPattern({
        shapeType: 'uShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 30,
        flangeB: 50,
        flangeC: 30,
      });

      expect(result.flatLength).toBeGreaterThan(0);
      // U-shape subtracts 2 x BD
      expect(result.flatLength).toBeLessThan(30 + 50 + 30);
    });

    it('should have longer flat length for U-shape than L-shape with same flanges', () => {
      const lShape = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 40,
        flangeB: 40,
      });

      const uShape = flatPattern({
        shapeType: 'uShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 40,
        flangeB: 40,
        flangeC: 40,
      });

      expect(uShape.flatLength).toBeGreaterThan(lShape.flatLength);
    });
  });

  describe('material K-factors', () => {
    it('should use correct K-factor for mild steel', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.kFactor).toBe(0.44);
    });

    it('should use correct K-factor for aluminum5052', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'aluminum5052',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.kFactor).toBe(0.40);
    });

    it('should use custom K-factor when provided', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        kFactor: 0.35,
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.kFactor).toBe(0.35);
    });
  });

  describe('bend allowance and deduction', () => {
    it('should calculate bend allowance', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
    });

    it('should calculate bend deduction', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.bendDeduction).toBeGreaterThan(0);
    });
  });

  describe('bend angle variations', () => {
    it('should handle acute bend angle', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 45,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.flatLength).toBeGreaterThan(0);
    });

    it('should handle obtuse bend angle', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 2,
        bendAngle: 135,
        insideRadius: 3,
        material: 'mildSteel',
        flangeA: 50,
        flangeB: 30,
      });

      expect(result.flatLength).toBeGreaterThan(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate bracket flat pattern', () => {
      const result = flatPattern({
        shapeType: 'lShape',
        thickness: 3,
        bendAngle: 90,
        insideRadius: 4,
        material: 'mildSteel',
        flangeA: 100,
        flangeB: 50,
      });

      expect(result.flatLength).toBeGreaterThan(140);
      expect(result.flatLength).toBeLessThan(150);
    });

    it('should calculate channel flat pattern', () => {
      const result = flatPattern({
        shapeType: 'uShape',
        thickness: 1.5,
        bendAngle: 90,
        insideRadius: 2,
        material: 'aluminum6061',
        flangeA: 25,
        flangeB: 50,
        flangeC: 25,
      });

      expect(result.flatLength).toBeGreaterThan(90);
    });
  });
});

describe('flatPattern — bend domain and flanges', () => {
  const base = { thickness: 2, insideRadius: 2, flangeA: 50, flangeB: 30 };

  it('throws at a closed hem (180° gave a flat length of −1.6 × 10¹⁷ mm)', () => {
    expect(() => flatPattern({ ...base, shapeType: 'lShape', bendAngle: 180 })).toThrow(RangeError);
  });

  it('throws for a non-positive flange, and for a missing third flange on a U-shape', () => {
    expect(() => flatPattern({ ...base, shapeType: 'lShape', bendAngle: 90, flangeA: 0 })).toThrow(RangeError);
    expect(() => flatPattern({ ...base, shapeType: 'uShape', bendAngle: 90 })).toThrow(RangeError);
    expect(flatPattern({ ...base, shapeType: 'lShape', bendAngle: 90 }).flatLength).toBeGreaterThan(0);
  });
});

describe('flatPattern refusals carry their facts', () => {
  const base = { thickness: 2, insideRadius: 2, bendAngle: 90, flangeA: 50, flangeB: 30 };

  it('refuses an unknown shape and an unknown material as unknown options', () => {
    expect(() => flatPattern({ ...base, shapeType: 'zShape' as never }))
      .toThrow(expect.objectContaining({ code: 'unknown_option', parameter: 'shapeType', got: 'zShape' }));
    expect(() => flatPattern({ ...base, shapeType: 'lShape', material: 'unobtainium' as never }))
      .toThrow(expect.objectContaining({ code: 'unknown_option', parameter: 'material', got: 'unobtainium' }));
  });

  it('names each flange that is not positive', () => {
    expect(() => flatPattern({ ...base, shapeType: 'lShape', flangeA: 0 }))
      .toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'flangeA', exclusive_min: 0, got: 0 }));
    expect(() => flatPattern({ ...base, shapeType: 'lShape', flangeB: -1 }))
      .toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'flangeB', exclusive_min: 0, got: -1 }));
    expect(() => flatPattern({ ...base, shapeType: 'uShape' }))
      .toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'flangeC', exclusive_min: 0, got: 0 }));
  });
});
