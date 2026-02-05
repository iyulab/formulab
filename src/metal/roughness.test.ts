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

    it('should return zero for zero N class input', () => {
      const result = roughness({ fromScale: 'N', value: 0 }); // Zero input

      expect(result.nClass).toBe(0); // Returns 0 for 0 input
      expect(result.ra).toBe(0);
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
    it('should handle zero value', () => {
      const result = roughness({ fromScale: 'Ra', value: 0 });

      expect(result.ra).toBe(0);
      expect(result.rz).toBe(0);
      expect(result.nClass).toBe(0);
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
