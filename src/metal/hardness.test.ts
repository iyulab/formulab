import { describe, it, expect } from 'vitest';
import { hardness, CONVERSION_TABLE } from './hardness.js';

describe('hardness', () => {
  describe('HRC to other scales', () => {
    it('should convert HRC 60 to other scales', () => {
      const result = hardness({
        fromScale: 'HRC',
        value: 60,
      });

      // From table: HRC 60 → HB 613, HV 697, Shore 81
      expect(result.HRC).toBe(60);
      expect(result.HB).toBe(613);
      expect(result.HV).toBe(697);
      expect(result.Shore).toBe(81);
    });

    it('should convert HRC 45 to other scales', () => {
      const result = hardness({
        fromScale: 'HRC',
        value: 45,
      });

      expect(result.HRC).toBe(45);
      expect(result.HB).toBe(421);
      expect(result.HV).toBe(446);
      expect(result.Shore).toBe(62);
    });

    it('should interpolate HRC 50 between table values', () => {
      // HRC 50 is in the table
      const result = hardness({
        fromScale: 'HRC',
        value: 50,
      });

      expect(result.HRC).toBe(50);
      expect(result.HB).toBe(481);
    });

    it('should interpolate between HRC 40 and HRC 45', () => {
      const result = hardness({
        fromScale: 'HRC',
        value: 42.5,
      });

      // Should be halfway between 40 and 45 values
      // HB: (371 + 421) / 2 = 396
      expect(result.HRC).toBe(42.5);
      expect(result.HB).toBe(396);
    });
  });

  describe('HB to other scales', () => {
    it('should convert HB 400 to other scales', () => {
      const result = hardness({
        fromScale: 'HB',
        value: 400,
      });

      // Interpolate between HB 371 (HRC 40) and HB 421 (HRC 45)
      expect(result.HRC).toBeCloseTo(43, 0);
      expect(result.HB).toBe(400);
    });

    it('should convert HB 250 to other scales', () => {
      const result = hardness({
        fromScale: 'HB',
        value: 250,
      });

      // Between HB 226 (HRC 20) and HB 253 (HRC 25)
      // Interpolated: HRC ≈ 24.4
      expect(result.HRC).toBeCloseTo(24.4, 0);
    });
  });

  describe('HV to other scales', () => {
    it('should convert HV 500 to other scales', () => {
      const result = hardness({
        fromScale: 'HV',
        value: 500,
      });

      // Between HV 446 (HRC 45) and HV 513 (HRC 50)
      expect(result.HRC).toBeCloseTo(49, 0);
    });

    it('should convert HV 300 to other scales', () => {
      const result = hardness({
        fromScale: 'HV',
        value: 300,
      });

      // Near HRC 30 (HV 302)
      expect(result.HRC).toBeCloseTo(30, 0);
    });
  });

  describe('Shore to other scales', () => {
    it('should convert Shore 70 to other scales', () => {
      const result = hardness({
        fromScale: 'Shore',
        value: 70,
      });

      // Between Shore 68 (HRC 50) and Shore 75 (HRC 55)
      expect(result.HRC).toBeCloseTo(51, 0);
    });
  });

  describe('clamping at boundaries', () => {
    it('should clamp at minimum value', () => {
      const result = hardness({
        fromScale: 'HRC',
        value: 10, // Below minimum HRC 20
      });

      // Should return HRC 20 row
      expect(result.HRC).toBe(20);
      expect(result.HB).toBe(226);
    });

    it('should clamp at maximum value', () => {
      const result = hardness({
        fromScale: 'HRC',
        value: 75, // Above maximum HRC 68
      });

      // Should return HRC 68 row
      expect(result.HRC).toBe(68);
      expect(result.HB).toBe(739);
    });

    it('should handle exactly minimum value', () => {
      const result = hardness({
        fromScale: 'HRC',
        value: 20,
      });

      expect(result.HRC).toBe(20);
    });

    it('should handle exactly maximum value', () => {
      const result = hardness({
        fromScale: 'HRC',
        value: 68,
      });

      expect(result.HRC).toBe(68);
    });
  });

  describe('consistency checks', () => {
    it('should be consistent when converting HRC→HB→HRC', () => {
      const hrc = 45;
      const toHB = hardness({ fromScale: 'HRC', value: hrc });
      const backToHRC = hardness({ fromScale: 'HB', value: toHB.HB });

      expect(backToHRC.HRC).toBeCloseTo(hrc, 0);
    });

    it('should have conversion table values match exactly', () => {
      for (const row of CONVERSION_TABLE) {
        const result = hardness({ fromScale: 'HRC', value: row.HRC });
        expect(result.HB).toBe(row.HB);
        expect(result.HV).toBe(row.HV);
        expect(result.Shore).toBe(row.Shore);
      }
    });
  });

  describe('real-world material examples', () => {
    it('should handle hardened tool steel (~HRC 60)', () => {
      const result = hardness({
        fromScale: 'HRC',
        value: 60,
      });

      // Typical hardened HSS/tool steel
      expect(result.HV).toBeGreaterThan(650);
      expect(result.Shore).toBeGreaterThan(78);
    });

    it('should handle mild steel (~HB 120-150)', () => {
      // Below our table minimum, so clamps
      const result = hardness({
        fromScale: 'HB',
        value: 150,
      });

      // Clamps to minimum
      expect(result.HRC).toBe(20);
    });

    it('should handle annealed carbon steel (~HRC 25-30)', () => {
      const result = hardness({
        fromScale: 'HRC',
        value: 27,
      });

      // Between HRC 25 (HB 253) and HRC 30 (HB 286)
      // Interpolated: HB ≈ 266
      expect(result.HB).toBeCloseTo(266, 0);
    });
  });
});
