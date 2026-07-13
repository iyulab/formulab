import { describe, it, expect } from 'vitest';
import { ppm } from './ppm.js';

describe('ppm', () => {
  describe('convert from defect rate', () => {
    it('should convert 1% defect rate', () => {
      const result = ppm({
        convertFrom: 'defectRate',
        value: 1,
      });

      expect(result.defectRate).toBe(1);
      expect(result.ppm).toBe(10000);
      expect(result.yieldRate).toBe(99);
    });

    it('should convert 0.1% defect rate', () => {
      const result = ppm({
        convertFrom: 'defectRate',
        value: 0.1,
      });

      expect(result.defectRate).toBe(0.1);
      expect(result.ppm).toBe(1000);
      expect(result.yieldRate).toBe(99.9);
    });

    it('should handle 0% defect rate', () => {
      const result = ppm({
        convertFrom: 'defectRate',
        value: 0,
      });

      expect(result.defectRate).toBe(0);
      expect(result.ppm).toBe(0);
      expect(result.yieldRate).toBe(100);
      expect(result.sigma).toBe(6); // Capped at 6 sigma
    });
  });

  describe('convert from PPM', () => {
    it('should convert 3.4 PPM (Six Sigma)', () => {
      const result = ppm({
        convertFrom: 'ppm',
        value: 3.4,
      });

      expect(result.ppm).toBeCloseTo(3.4, 1);
      expect(result.defectRate).toBeCloseTo(0.00034, 4);
      expect(result.sigma).toBeCloseTo(6, 0);
    });

    it('should convert 10000 PPM (1% defect)', () => {
      const result = ppm({
        convertFrom: 'ppm',
        value: 10000,
      });

      expect(result.ppm).toBe(10000);
      expect(result.defectRate).toBe(1);
    });

    it('should convert 66807 PPM (3 Sigma)', () => {
      const result = ppm({
        convertFrom: 'ppm',
        value: 66807,
      });

      expect(result.sigma).toBeCloseTo(3, 0);
    });
  });

  describe('convert from sigma', () => {
    it('should convert 6 sigma', () => {
      const result = ppm({
        convertFrom: 'sigma',
        value: 6,
      });

      expect(result.sigma).toBeCloseTo(6, 0);
      expect(result.ppm).toBeCloseTo(3.4, 0);
      expect(result.yieldRate).toBeCloseTo(99.99966, 2);
    });

    it('should convert 3 sigma', () => {
      const result = ppm({
        convertFrom: 'sigma',
        value: 3,
      });

      expect(result.sigma).toBeCloseTo(3, 0);
      expect(result.defectRate).toBeCloseTo(6.68, 0);
    });

    it('should convert 4 sigma', () => {
      const result = ppm({
        convertFrom: 'sigma',
        value: 4,
      });

      expect(result.sigma).toBeCloseTo(4, 0);
      // 4 sigma with 1.5 shift ≈ 6210 PPM
      expect(result.ppm).toBeCloseTo(6210, -2);
    });

    it('should handle 0 sigma', () => {
      const result = ppm({
        convertFrom: 'sigma',
        value: 0,
      });

      expect(result.sigma).toBeCloseTo(0, 0);
      expect(result.defectRate).toBeGreaterThan(90);
    });
  });

  describe('consistency checks', () => {
    it('should be consistent: defectRate -> sigma -> defectRate', () => {
      const original = 2.5;
      const toSigma = ppm({ convertFrom: 'defectRate', value: original });
      const back = ppm({ convertFrom: 'sigma', value: toSigma.sigma });

      expect(back.defectRate).toBeCloseTo(original, 1);
    });

    it('should be consistent: ppm -> defectRate -> ppm', () => {
      const original = 5000;
      const toDefect = ppm({ convertFrom: 'ppm', value: original });
      const back = ppm({ convertFrom: 'defectRate', value: toDefect.defectRate });

      expect(back.ppm).toBeCloseTo(original, 0);
    });
  });

  describe('edge cases', () => {
    // Out-of-range inputs used to be clamped silently (150% → 100%, sigma 10 → 6),
    // substituting a different quality level than requested; they now throw (2026-07 sweep).
    it('should throw for defect rate above 100%', () => {
      expect(() => ppm({ convertFrom: 'defectRate', value: 150 })).toThrow(RangeError);
    });

    it('should throw for negative defect rate', () => {
      expect(() => ppm({ convertFrom: 'defectRate', value: -10 })).toThrow(RangeError);
    });

    it('should throw for sigma above 6', () => {
      expect(() => ppm({ convertFrom: 'sigma', value: 10 })).toThrow(RangeError);
    });
  });

  describe('real-world quality levels', () => {
    it('should calculate typical manufacturing (4 sigma)', () => {
      const result = ppm({
        convertFrom: 'sigma',
        value: 4,
      });

      expect(result.yieldRate).toBeGreaterThan(99);
    });

    it('should calculate world-class (6 sigma)', () => {
      const result = ppm({
        convertFrom: 'sigma',
        value: 6,
      });

      expect(result.yieldRate).toBeGreaterThan(99.9996);
    });
  });
});

describe('ppm input validation (2026-07 clamp sweep)', () => {
  it('throws RangeError for defectRate outside [0, 100] (was silently clamped)', () => {
    expect(() => ppm({ convertFrom: 'defectRate', value: 150 })).toThrow(RangeError);
    expect(() => ppm({ convertFrom: 'defectRate', value: -1 })).toThrow(RangeError);
  });

  it('throws RangeError for ppm outside [0, 1,000,000]', () => {
    expect(() => ppm({ convertFrom: 'ppm', value: 1_500_000 })).toThrow(RangeError);
    expect(() => ppm({ convertFrom: 'ppm', value: -5 })).toThrow(RangeError);
  });

  it('throws RangeError for sigma outside [0, 6] (sigma 7 was silently degraded to 6)', () => {
    expect(() => ppm({ convertFrom: 'sigma', value: 7 })).toThrow(RangeError);
    expect(() => ppm({ convertFrom: 'sigma', value: -0.5 })).toThrow(RangeError);
  });

  it('accepts the domain boundaries exactly', () => {
    expect(ppm({ convertFrom: 'sigma', value: 6 }).sigma).toBeGreaterThan(0);
    expect(ppm({ convertFrom: 'defectRate', value: 100 }).yieldRate).toBe(0);
    expect(ppm({ convertFrom: 'ppm', value: 1_000_000 }).defectRate).toBe(100);
  });
});
