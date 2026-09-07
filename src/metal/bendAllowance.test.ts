import { describe, it, expect } from 'vitest';
import { bendAllowance } from './bendAllowance.js';

describe('bendAllowance', () => {
  describe('basic calculations', () => {
    it('should calculate bend allowance for 90 degree bend in mild steel', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
      expect(result.bendDeduction).toBeGreaterThan(0);
      expect(result.outsideSetback).toBeGreaterThan(0);
      expect(result.kFactor).toBe(0.44);
    });

    it('should calculate bend allowance for 45 degree bend', () => {
      const result = bendAllowance({
        thickness: 1.5,
        bendAngle: 45,
        insideRadius: 2,
        material: 'mildSteel',
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
      expect(result.bendAllowance).toBeLessThan(
        bendAllowance({ thickness: 1.5, bendAngle: 90, insideRadius: 2, material: 'mildSteel' }).bendAllowance
      );
    });

    it('should increase bend allowance with larger angle', () => {
      const small = bendAllowance({ thickness: 2, bendAngle: 45, insideRadius: 3, material: 'mildSteel' });
      const large = bendAllowance({ thickness: 2, bendAngle: 135, insideRadius: 3, material: 'mildSteel' });

      expect(large.bendAllowance).toBeGreaterThan(small.bendAllowance);
    });
  });

  describe('material types', () => {
    it('should use correct K-factor for stainless304', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 4,
        material: 'stainless304',
      });

      expect(result.kFactor).toBe(0.45);
    });

    it('should use correct K-factor for aluminum5052', () => {
      const result = bendAllowance({
        thickness: 1.5,
        bendAngle: 90,
        insideRadius: 2,
        material: 'aluminum5052',
      });

      expect(result.kFactor).toBe(0.40);
    });

    it('should use correct K-factor for aluminum6061', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'aluminum6061',
      });

      expect(result.kFactor).toBe(0.42);
    });
  });

  describe('custom K-factor', () => {
    it('should use provided K-factor when specified', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
        kFactor: 0.33,
      });

      expect(result.kFactor).toBe(0.33);
    });
  });

  describe('V-die recommendations', () => {
    it('should recommend V-die opening based on thickness', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
      });

      // V-die = 8 x thickness = 16mm
      expect(result.recommendedVDie).toBe(16);
    });

    it('should recommend larger V-die for thicker material', () => {
      const thin = bendAllowance({ thickness: 1, bendAngle: 90, insideRadius: 2, material: 'mildSteel' });
      const thick = bendAllowance({ thickness: 4, bendAngle: 90, insideRadius: 5, material: 'mildSteel' });

      expect(thick.recommendedVDie).toBeGreaterThan(thin.recommendedVDie);
    });
  });

  describe('minimum bend radius', () => {
    it('reads mild steel from DIN 6935 Table 1, not a flat multiple', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 2,
        material: 'mildSteel',
      });

      // Table 1, band over 1.5 up to 2.5, lowest strength class, along the rolling
      // direction (the default): r = 2.5mm. A flat 1.0x multiplier would say 2mm.
      expect(result.minBendRadius).toBe(2.5);
      expect(result.minBendRadiusBasis).toBe('din6935');
    });

    it('allows the tighter transverse radius when the orientation is stated', () => {
      const result = bendAllowance({
        thickness: 4,
        bendAngle: 90,
        insideRadius: 5,
        material: 'mildSteel',
        rollingDirection: 'transverse',
      });

      // Table 1, band over 3 up to 4: transverse 5mm against longitudinal 6mm.
      expect(result.minBendRadius).toBe(5);
      expect(
        bendAllowance({
          thickness: 4,
          bendAngle: 90,
          insideRadius: 5,
          material: 'mildSteel',
          rollingDirection: 'longitudinal',
        }).minBendRadius,
      ).toBe(6);
    });

    it('warns on a plate combination a flat multiplier would pass silently', () => {
      // The defect this table replaced: at 10mm the flat 1.0x multiplier put the limit at
      // 10mm, so a 12mm inside radius drew no warning even though Table 1 requires 20mm
      // along the rolling direction.
      const result = bendAllowance({
        thickness: 10,
        bendAngle: 90,
        insideRadius: 12,
        material: 'mildSteel',
      });

      expect(result.minBendRadius).toBe(20);
      expect(result.warnings.some((w) => w.includes('minimum'))).toBe(true);
    });

    it('falls back to the conventional multiplier past the table', () => {
      const result = bendAllowance({
        thickness: 25,
        bendAngle: 90,
        insideRadius: 30,
        material: 'mildSteel',
      });

      // DIN 6935 Table 1 stops at 20mm; beyond it the conventional 1.0x applies and says so.
      expect(result.minBendRadius).toBe(25);
      expect(result.minBendRadiusBasis).toBe('convention');
    });

    it('should calculate larger min bend radius for stainless', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 4,
        material: 'stainless304',
      });

      // Min bend radius = 2.0 x thickness = 4mm. DIN 6935 is scoped to flat steel products,
      // so the alloys keep their conventional multipliers and report that basis.
      expect(result.minBendRadius).toBe(4);
      expect(result.minBendRadiusBasis).toBe('convention');
    });

    it('keeps the alloys on conventional multipliers', () => {
      for (const material of ['aluminum5052', 'aluminum6061', 'custom'] as const) {
        expect(
          bendAllowance({ thickness: 3, bendAngle: 90, insideRadius: 5, material })
            .minBendRadiusBasis,
        ).toBe('convention');
      }
    });
  });

  describe('warnings', () => {
    it('should warn when inside radius is less than minimum', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 1, // Less than 2mm minimum
        material: 'mildSteel',
      });

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('less than minimum');
    });

    it('should warn for extreme bend angles', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 175,
        insideRadius: 3,
        material: 'mildSteel',
      });

      expect(result.warnings.some(w => w.includes('springback'))).toBe(true);
    });

    it('should not warn for normal parameters', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 90,
        insideRadius: 3,
        material: 'mildSteel',
      });

      expect(result.warnings.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very small angle', () => {
      const result = bendAllowance({
        thickness: 2,
        bendAngle: 10,
        insideRadius: 3,
        material: 'mildSteel',
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
    });

    it('should handle thick material', () => {
      const result = bendAllowance({
        thickness: 10,
        bendAngle: 90,
        insideRadius: 15,
        material: 'mildSteel',
      });

      expect(result.bendAllowance).toBeGreaterThan(0);
      expect(result.recommendedVDie).toBe(80);
    });
  });
});
