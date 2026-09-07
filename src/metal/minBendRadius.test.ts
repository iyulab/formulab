import { describe, it, expect } from 'vitest';
import { minBendRadiusDin6935, DIN_6935_MAX_THICKNESS } from './minBendRadius.js';

describe('minBendRadiusDin6935', () => {
  describe("the standard's own worked example", () => {
    // DIN 6935:2010-01, Clause 3: 6 mm Q St 42-2 sheet (guaranteed minimum tensile strength
    // over 390 up to 490 N/mm2, per Table 3) bent across the rolling direction gives
    // r = 10 mm at a bend angle up to 120 degrees, and r = 12 mm above it.
    it('gives 10 mm for 6 mm Q St 42-2 bent transverse at 90 degrees', () => {
      const result = minBendRadiusDin6935({
        thickness: 6,
        strengthClass: 'over390UpTo490',
        rollingDirection: 'transverse',
        bendAngle: 90,
      });

      expect(result).not.toBeNull();
      expect(result?.minBendRadius).toBe(10);
      expect(result?.tabulatedRadius).toBe(10);
      expect(result?.thicknessBandUpper).toBe(6);
      expect(result?.nextSizeUpApplied).toBe(false);
    });

    it('steps to 12 mm for the same sheet above 120 degrees', () => {
      const result = minBendRadiusDin6935({
        thickness: 6,
        strengthClass: 'over390UpTo490',
        rollingDirection: 'transverse',
        bendAngle: 150,
      });

      expect(result?.minBendRadius).toBe(12);
      expect(result?.tabulatedRadius).toBe(10);
      expect(result?.nextSizeUpApplied).toBe(true);
    });

    it('treats exactly 120 degrees as within the tabulated value', () => {
      const result = minBendRadiusDin6935({
        thickness: 6,
        strengthClass: 'over390UpTo490',
        rollingDirection: 'transverse',
        bendAngle: 120,
      });

      expect(result?.minBendRadius).toBe(10);
      expect(result?.nextSizeUpApplied).toBe(false);
    });
  });

  describe('Table 1 spot values', () => {
    it('reads the first band at its lower and upper edge alike', () => {
      const thin = minBendRadiusDin6935({
        thickness: 0.5,
        strengthClass: 'upTo390',
        rollingDirection: 'transverse',
      });
      const edge = minBendRadiusDin6935({
        thickness: 1,
        strengthClass: 'upTo390',
        rollingDirection: 'transverse',
      });

      expect(thin?.minBendRadius).toBe(1);
      expect(edge?.minBendRadius).toBe(1);
      expect(edge?.thicknessBandUpper).toBe(1);
    });

    it('crosses into the next band just above a boundary', () => {
      const result = minBendRadiusDin6935({
        thickness: 1.01,
        strengthClass: 'upTo390',
        rollingDirection: 'transverse',
      });

      expect(result?.minBendRadius).toBe(1.6);
      expect(result?.thicknessBandUpper).toBe(1.5);
    });

    it('reads the last band of the table', () => {
      const result = minBendRadiusDin6935({
        thickness: 20,
        strengthClass: 'over490UpTo640',
        rollingDirection: 'longitudinal',
      });

      expect(result?.minBendRadius).toBe(63);
      expect(result?.thicknessBandUpper).toBe(20);
    });
  });

  describe('the three axes the table distinguishes', () => {
    it('requires at least as much radius along the rolling direction as across it', () => {
      for (const thickness of [0.8, 2, 4, 6, 10, 14, 20]) {
        const transverse = minBendRadiusDin6935({
          thickness,
          strengthClass: 'upTo390',
          rollingDirection: 'transverse',
        });
        const longitudinal = minBendRadiusDin6935({
          thickness,
          strengthClass: 'upTo390',
          rollingDirection: 'longitudinal',
        });

        expect(longitudinal?.minBendRadius).toBeGreaterThanOrEqual(
          transverse?.minBendRadius as number,
        );
      }
    });

    it('never asks a stronger steel for a smaller radius', () => {
      for (const thickness of [0.8, 2, 4, 6, 10, 14, 20]) {
        const low = minBendRadiusDin6935({
          thickness,
          strengthClass: 'upTo390',
          rollingDirection: 'transverse',
        });
        const mid = minBendRadiusDin6935({
          thickness,
          strengthClass: 'over390UpTo490',
          rollingDirection: 'transverse',
        });
        const high = minBendRadiusDin6935({
          thickness,
          strengthClass: 'over490UpTo640',
          rollingDirection: 'transverse',
        });

        expect(mid?.minBendRadius).toBeGreaterThanOrEqual(low?.minBendRadius as number);
        expect(high?.minBendRadius).toBeGreaterThanOrEqual(mid?.minBendRadius as number);
      }
    });

    it('grows with thickness across every band', () => {
      const radii = [0.5, 1.2, 2, 2.8, 3.5, 4.5, 5.5, 6.5, 7.5, 9, 11, 13, 15, 17, 19].map(
        (thickness) =>
          minBendRadiusDin6935({
            thickness,
            strengthClass: 'upTo390',
            rollingDirection: 'transverse',
          })?.minBendRadius as number,
      );

      for (let i = 1; i < radii.length; i++) {
        expect(radii[i]).toBeGreaterThan(radii[i - 1]);
      }
    });
  });

  describe('the effective multiple is not constant', () => {
    // This is the whole reason the table exists rather than a single multiplier: a flat 1.0x
    // matches only the thinnest band and understates the limit by roughly half in plate.
    it('is 1.0x at the thinnest band and about 2x in plate', () => {
      const thin = minBendRadiusDin6935({
        thickness: 1,
        strengthClass: 'upTo390',
        rollingDirection: 'transverse',
      });
      const plate = minBendRadiusDin6935({
        thickness: 10,
        strengthClass: 'upTo390',
        rollingDirection: 'transverse',
      });

      expect((thin?.minBendRadius as number) / 1).toBe(1);
      expect((plate?.minBendRadius as number) / 10).toBe(1.6);
    });
  });

  describe('outside what the standard covers', () => {
    it('returns null past the largest tabulated thickness', () => {
      expect(
        minBendRadiusDin6935({
          thickness: DIN_6935_MAX_THICKNESS + 0.1,
          strengthClass: 'upTo390',
          rollingDirection: 'transverse',
        }),
      ).toBeNull();
    });

    it('returns null when the >120 degree rule has no higher value to step to', () => {
      expect(
        minBendRadiusDin6935({
          thickness: 20,
          strengthClass: 'upTo390',
          rollingDirection: 'transverse',
          bendAngle: 150,
        }),
      ).toBeNull();
    });

    it('rejects a non-positive thickness', () => {
      expect(() =>
        minBendRadiusDin6935({
          thickness: 0,
          strengthClass: 'upTo390',
          rollingDirection: 'transverse',
        }),
      ).toThrow();
    });
  });
});
