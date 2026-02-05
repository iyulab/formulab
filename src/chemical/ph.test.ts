import { describe, it, expect } from 'vitest';
import { ph } from './ph.js';

describe('ph', () => {
  describe('Henderson-Hasselbalch equation', () => {
    it('should calculate pH at equal acid/base concentrations', () => {
      const result = ph({
        bufferSystem: 'acetate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      // pH = pKa + log(1) = pKa + 0 = pKa
      // Acetate pKa = 4.76
      expect(result.pH).toBe(4.76);
    });

    it('should calculate pH when base > acid', () => {
      const result = ph({
        bufferSystem: 'acetate',
        acidConcentration: 0.1,
        baseConcentration: 1.0,
        temperature: 25,
      });

      // pH = 4.76 + log(10) = 4.76 + 1 = 5.76
      expect(result.pH).toBe(5.76);
    });

    it('should calculate pH when acid > base', () => {
      const result = ph({
        bufferSystem: 'acetate',
        acidConcentration: 1.0,
        baseConcentration: 0.1,
        temperature: 25,
      });

      // pH = 4.76 + log(0.1) = 4.76 - 1 = 3.76
      expect(result.pH).toBe(3.76);
    });
  });

  describe('buffer systems', () => {
    it('should use correct pKa for acetate buffer', () => {
      const result = ph({
        bufferSystem: 'acetate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      expect(result.pKa).toBe(4.76);
    });

    it('should use correct pKa for phosphate buffer', () => {
      const result = ph({
        bufferSystem: 'phosphate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      expect(result.pKa).toBe(7.20);
    });

    it('should use correct pKa for Tris buffer', () => {
      const result = ph({
        bufferSystem: 'tris',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      expect(result.pKa).toBe(8.07);
    });

    it('should use correct pKa for citrate buffer', () => {
      const result = ph({
        bufferSystem: 'citrate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      expect(result.pKa).toBe(6.40);
    });

    it('should use correct pKa for carbonate buffer', () => {
      const result = ph({
        bufferSystem: 'carbonate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      expect(result.pKa).toBe(6.35);
    });
  });

  describe('temperature correction', () => {
    it('should not change acetate pKa with temperature (negligible coefficient)', () => {
      const result25 = ph({
        bufferSystem: 'acetate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      const result37 = ph({
        bufferSystem: 'acetate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 37,
      });

      expect(result25.pKa).toBe(result37.pKa);
    });

    it('should decrease Tris pKa at higher temperature', () => {
      const result25 = ph({
        bufferSystem: 'tris',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      const result37 = ph({
        bufferSystem: 'tris',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 37,
      });

      // Tris dpKa/dT = -0.028, so pKa decreases with temperature
      expect(result37.pKa).toBeLessThan(result25.pKa);
      // Change = -0.028 * 12 = -0.336
      expect(result25.pKa - result37.pKa).toBeCloseTo(0.34, 1);
    });
  });

  describe('custom pKa', () => {
    it('should use custom pKa when provided', () => {
      const result = ph({
        bufferSystem: 'custom',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
        customPka: 5.0,
      });

      expect(result.pKa).toBe(5.0);
      expect(result.pH).toBe(5.0);
    });

    it('should default to pKa 7.0 when custom pKa not provided', () => {
      const result = ph({
        bufferSystem: 'custom',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      expect(result.pKa).toBe(7.0);
    });
  });

  describe('effective range', () => {
    it('should calculate effective range as pKa ± 1', () => {
      const result = ph({
        bufferSystem: 'phosphate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      // pKa = 7.20
      expect(result.effectiveRange.min).toBe(6.20);
      expect(result.effectiveRange.max).toBe(8.20);
    });
  });

  describe('buffer capacity', () => {
    it('should calculate maximum buffer capacity at pH = pKa', () => {
      const result = ph({
        bufferSystem: 'acetate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      // At pH = pKa, capacity is maximized
      expect(result.bufferCapacity).toBeGreaterThan(0);
    });

    it('should show higher capacity for higher concentrations', () => {
      const lowConc = ph({
        bufferSystem: 'acetate',
        acidConcentration: 0.01,
        baseConcentration: 0.01,
        temperature: 25,
      });

      const highConc = ph({
        bufferSystem: 'acetate',
        acidConcentration: 0.1,
        baseConcentration: 0.1,
        temperature: 25,
      });

      expect(highConc.bufferCapacity).toBeGreaterThan(lowConc.bufferCapacity);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero acid concentration', () => {
      const result = ph({
        bufferSystem: 'acetate',
        acidConcentration: 0,
        baseConcentration: 0.1,
        temperature: 25,
      });

      expect(result.pH).toBe(0);
      expect(result.pKa).toBe(0);
      expect(result.bufferCapacity).toBe(0);
    });

    it('should handle very low base concentration', () => {
      const result = ph({
        bufferSystem: 'acetate',
        acidConcentration: 1.0,
        baseConcentration: 0.001,
        temperature: 25,
      });

      // pH = 4.76 + log(0.001) = 4.76 - 3 = 1.76
      expect(result.pH).toBeCloseTo(1.76, 1);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate PBS buffer pH', () => {
      const result = ph({
        bufferSystem: 'phosphate',
        acidConcentration: 0.04, // NaH2PO4
        baseConcentration: 0.16, // Na2HPO4
        temperature: 25,
      });

      // pH = 7.20 + log(4) = 7.20 + 0.60 = 7.80
      expect(result.pH).toBeCloseTo(7.80, 1);
    });

    it('should calculate TAE buffer for electrophoresis', () => {
      const result = ph({
        bufferSystem: 'tris',
        acidConcentration: 0.02,
        baseConcentration: 0.04,
        temperature: 25,
      });

      // pH = 8.07 + log(2) = 8.07 + 0.30 = 8.37
      expect(result.pH).toBeCloseTo(8.37, 1);
    });
  });
});
