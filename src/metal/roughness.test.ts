import { describe, it, expect } from 'vitest';
import { roughness } from './roughness.js';

describe('roughness', () => {
  describe('conversion from Ra', () => {
    it('should convert Ra 0.8 to Rz and N class', () => {
      const result = roughness({ fromScale: 'Ra', value: 0.8 });

      expect(result.ra).toBe(0.8);
      expect(result.rz).toBe(3.2);
      expect(result.nClass).toBe(6);
    });

    it('should convert Ra 1.6 to correct values', () => {
      const result = roughness({ fromScale: 'Ra', value: 1.6 });

      expect(result.ra).toBe(1.6);
      expect(result.rz).toBe(6.3);
      expect(result.nClass).toBe(7);
    });

    it('should convert Ra 3.2 to correct values', () => {
      const result = roughness({ fromScale: 'Ra', value: 3.2 });

      expect(result.ra).toBe(3.2);
      expect(result.rz).toBe(12.5);
      expect(result.nClass).toBe(8);
    });

    it('should find closest match for non-standard Ra', () => {
      const result = roughness({ fromScale: 'Ra', value: 1.0 }); // Between 0.8 and 1.6

      expect(result.nClass).toBeGreaterThan(0);
    });
  });

  describe('conversion from Rz', () => {
    it('should convert Rz 6.3 to Ra and N class', () => {
      const result = roughness({ fromScale: 'Rz', value: 6.3 });

      expect(result.ra).toBe(1.6);
      expect(result.rz).toBe(6.3);
      expect(result.nClass).toBe(7);
    });

    it('should convert Rz 12.5 to correct values', () => {
      const result = roughness({ fromScale: 'Rz', value: 12.5 });

      expect(result.ra).toBe(3.2);
      expect(result.rz).toBe(12.5);
      expect(result.nClass).toBe(8);
    });
  });

  describe('conversion from N class', () => {
    it('should convert N6 to Ra and Rz', () => {
      const result = roughness({ fromScale: 'N', value: 6 });

      expect(result.ra).toBe(0.8);
      expect(result.rz).toBe(3.2);
      expect(result.nClass).toBe(6);
    });

    it('should convert N8 to correct values', () => {
      const result = roughness({ fromScale: 'N', value: 8 });

      expect(result.ra).toBe(3.2);
      expect(result.rz).toBe(12.5);
      expect(result.nClass).toBe(8);
    });

    it('should clamp N class to valid range', () => {
      const result = roughness({ fromScale: 'N', value: 15 }); // Out of range

      expect(result.nClass).toBe(12); // Max valid N class
    });

    it('should throw for zero N class input', () => {
      expect(() => roughness({ fromScale: 'N', value: 0 })).toThrow(RangeError);
    });

    it('should clamp low N class to valid range', () => {
      const result = roughness({ fromScale: 'N', value: 0.5 }); // Rounds to 1

      expect(result.nClass).toBe(1); // Min valid N class
    });
  });

  describe('RMS calculation', () => {
    it('should calculate RMS from Ra', () => {
      const result = roughness({ fromScale: 'Ra', value: 1.6 });

      // RMS = Ra x 1.11
      expect(result.rms).toBeCloseTo(1.776, 2);
    });
  });

  describe('edge cases', () => {
    it('should throw for zero value', () => {
      expect(() => roughness({ fromScale: 'Ra', value: 0 })).toThrow(RangeError);
    });
  });

  describe('full ISO 1302 table', () => {
    it('should handle N1 (finest)', () => {
      const result = roughness({ fromScale: 'N', value: 1 });

      expect(result.ra).toBe(0.025);
      expect(result.rz).toBe(0.1);
    });

    it('should handle N12 (roughest)', () => {
      const result = roughness({ fromScale: 'N', value: 12 });

      expect(result.ra).toBe(50);
      expect(result.rz).toBe(200);
    });
  });

  describe('out-of-table disclosure (ISSUE-20260713 silent clamp)', () => {
    // Regression pins from the issue's execution evidence.
    it('flags lapped/superfinished Ra 0.006 µm snapped 4× up to N1 (0.025)', () => {
      const result = roughness({ fromScale: 'Ra', value: 0.006 });

      expect(result.nClass).toBe(1);
      expect(result.ra).toBe(0.025);
      expect(result.outOfTableRange).toBe(true);
    });

    it('flags rough sand-cast Ra 100 µm snapped 0.5× down to N12 (50)', () => {
      const result = roughness({ fromScale: 'Ra', value: 100 });

      expect(result.nClass).toBe(12);
      expect(result.ra).toBe(50);
      expect(result.outOfTableRange).toBe(true);
    });

    it('flags N 14 clamped to N12', () => {
      const result = roughness({ fromScale: 'N', value: 14 });

      expect(result.nClass).toBe(12);
      expect(result.outOfTableRange).toBe(true);
    });

    it('flags Rz outside the table (Rz 500 → N12)', () => {
      const result = roughness({ fromScale: 'Rz', value: 500 });

      expect(result.nClass).toBe(12);
      expect(result.outOfTableRange).toBe(true);
    });

    it('does not flag exact boundary hits (Ra 0.025 and Ra 50)', () => {
      expect(roughness({ fromScale: 'Ra', value: 0.025 }).outOfTableRange).toBe(false);
      expect(roughness({ fromScale: 'Ra', value: 50 }).outOfTableRange).toBe(false);
    });

    it('does not flag nearest-grade snapping within the table (by design)', () => {
      const result = roughness({ fromScale: 'Ra', value: 1.0 }); // between N6 (0.8) and N7 (1.6)

      expect(result.outOfTableRange).toBe(false);
    });

    it('does not flag non-integer N that rounds into range (N 0.5 → N1)', () => {
      const result = roughness({ fromScale: 'N', value: 0.5 });

      expect(result.nClass).toBe(1);
      expect(result.outOfTableRange).toBe(false);
    });
  });

  describe('real-world scenarios', () => {
    it('should identify machined surface (N7)', () => {
      const result = roughness({ fromScale: 'Ra', value: 1.6 });

      expect(result.nClass).toBe(7);
    });

    it('should identify ground surface (N5)', () => {
      const result = roughness({ fromScale: 'Ra', value: 0.4 });

      expect(result.nClass).toBe(5);
    });

    it('should identify polished surface (N3)', () => {
      const result = roughness({ fromScale: 'Ra', value: 0.1 });

      expect(result.nClass).toBe(3);
    });
  });
});
