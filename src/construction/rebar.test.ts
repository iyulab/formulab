import { describe, it, expect } from 'vitest';
import { rebarWeight, getRebarUnitWeight } from './rebar.js';

describe('rebarWeight', () => {
  describe('unit weights', () => {
    // Golden values: KS D 3504:2025 Table 4 (단위 무게 column), read directly from the
    // standard's own official text on 2026-08-28 — see rebar.ts's @reference.
    it('should return correct unit weight for D10', () => {
      expect(getRebarUnitWeight('D10')).toBe(0.560);
    });

    it('should return correct unit weight for D13', () => {
      expect(getRebarUnitWeight('D13')).toBe(0.995);
    });

    it('should return correct unit weight for D16', () => {
      expect(getRebarUnitWeight('D16')).toBe(1.56);
    });

    it('should return correct unit weight for D19', () => {
      expect(getRebarUnitWeight('D19')).toBe(2.25);
    });

    it('should return correct unit weight for D22', () => {
      expect(getRebarUnitWeight('D22')).toBe(3.04);
    });

    it('should return correct unit weight for D25', () => {
      expect(getRebarUnitWeight('D25')).toBe(3.98);
    });

    it('should return correct unit weight for D29', () => {
      expect(getRebarUnitWeight('D29')).toBe(5.04);
    });

    it('should return correct unit weight for D32', () => {
      expect(getRebarUnitWeight('D32')).toBe(6.23);
    });

    // Structural invariant from the standard's own 비고 1: unit weight = 0.00785 x nominal
    // cross-section area (S = 0.7854 x d^2) — pins the table to its own formula, not just to
    // hand-copied numbers, so a future transcription slip in one entry is still caught.
    it('every unit weight reproduces the standard\'s own S = 0.7854 x d^2, weight = 0.00785 x S formula', () => {
      const nominalDiameters: Record<string, number> = {
        D10: 9.53, D13: 12.7, D16: 15.9, D19: 19.1,
        D22: 22.2, D25: 25.4, D29: 28.6, D32: 31.8,
      };
      for (const [size, d] of Object.entries(nominalDiameters)) {
        const s = 0.7854 * d ** 2;
        const expectedWeight = Math.round(0.00785 * s * 1000) / 1000;
        expect(getRebarUnitWeight(size as never)).toBeCloseTo(expectedWeight, 1);
      }
    });
  });

  describe('basic calculations', () => {
    it('should calculate total length correctly', () => {
      const result = rebarWeight({
        size: 'D16',
        length: 6, // 6m each
        quantity: 10,
      });

      // Total length = 6 × 10 = 60 m
      expect(result.totalLength).toBe(60);
    });

    it('should calculate total weight correctly', () => {
      const result = rebarWeight({
        size: 'D16',
        length: 6,
        quantity: 10,
      });

      // Unit weight = 1.56 kg/m
      // Total weight = 1.56 × 60 = 93.6 kg
      expect(result.unitWeight).toBe(1.56);
      expect(result.totalWeight).toBe(93.6);
    });
  });

  describe('different sizes', () => {
    it('should calculate for D10', () => {
      const result = rebarWeight({
        size: 'D10',
        length: 12,
        quantity: 50,
      });

      // Total length = 600 m
      // Weight = 0.560 × 600 = 336.0 kg
      expect(result.totalLength).toBe(600);
      expect(result.totalWeight).toBe(336.0);
    });

    it('should calculate for D25', () => {
      const result = rebarWeight({
        size: 'D25',
        length: 12,
        quantity: 20,
      });

      // Total length = 240 m
      // Weight = 3.98 × 240 = 955.2 kg
      expect(result.totalLength).toBe(240);
      expect(result.totalWeight).toBe(955.2);
    });

    it('should calculate for D32', () => {
      const result = rebarWeight({
        size: 'D32',
        length: 12,
        quantity: 10,
      });

      // Total length = 120 m
      // Weight = 6.23 × 120 = 747.6 kg
      expect(result.totalLength).toBe(120);
      expect(result.totalWeight).toBe(747.6);
    });
  });

  describe('fractional lengths', () => {
    it('should handle fractional bar lengths', () => {
      const result = rebarWeight({
        size: 'D16',
        length: 3.5,
        quantity: 8,
      });

      // Total length = 3.5 × 8 = 28 m
      // Weight = 1.56 × 28 = 43.68 kg
      expect(result.totalLength).toBe(28);
      expect(result.totalWeight).toBe(43.68);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for column reinforcement', () => {
      // 4 main bars D25, 3m height, plus ties D10
      const mainBars = rebarWeight({
        size: 'D25',
        length: 3.5, // with lap
        quantity: 4,
      });

      // 14 m of D25 = 3.98 × 14 = 55.72 kg
      expect(mainBars.totalWeight).toBe(55.72);
    });

    it('should calculate for slab reinforcement', () => {
      // Bottom mat: D10 @ 150mm, 100m²
      // Each direction: 100/0.15 = 667 bars × 10m average
      const slabRebar = rebarWeight({
        size: 'D10',
        length: 10,
        quantity: 670,
      });

      // Total length = 6700 m; weight = 0.560 × 6700 = 3752.0 kg
      expect(slabRebar.totalLength).toBe(6700);
      expect(slabRebar.totalWeight).toBe(3752.0);
    });

    it('should calculate for beam reinforcement', () => {
      // 6m beam with 4×D22 bottom, 2×D16 top
      const bottom = rebarWeight({
        size: 'D22',
        length: 6.5, // with anchorage
        quantity: 4,
      });

      const top = rebarWeight({
        size: 'D16',
        length: 6.5,
        quantity: 2,
      });

      // Bottom = 3.04 × 26 = 79.04 kg
      // Top = 1.56 × 13 = 20.28 kg
      expect(bottom.totalWeight).toBe(79.04);
      expect(top.totalWeight).toBe(20.28);
    });

    it('should calculate for foundation mat', () => {
      // Large mat foundation with heavy reinforcement
      const result = rebarWeight({
        size: 'D32',
        length: 12,
        quantity: 100,
      });

      // Total length = 1200 m
      // Weight = 6.23 × 1200 = 7476 kg = 7.48 tonnes
      expect(result.totalWeight).toBe(7476);
    });
  });

  describe('edge cases', () => {
    it('should handle single bar', () => {
      const result = rebarWeight({
        size: 'D16',
        length: 6,
        quantity: 1,
      });

      expect(result.totalLength).toBe(6);
      expect(result.totalWeight).toBe(9.36);
    });

    it('should handle short bars', () => {
      const result = rebarWeight({
        size: 'D10',
        length: 0.5, // stirrup legs
        quantity: 100,
      });

      expect(result.totalLength).toBe(50);
      expect(result.totalWeight).toBe(28.0);
    });
  });
});

describe('rebarWeight contract restoration (2026-07 audit)', () => {
  it('throws RangeError for an unknown rebar size (was silent NaN)', () => {
    expect(() => rebarWeight({ size: 'D99' as never, length: 10, quantity: 5 })).toThrow(RangeError);
  });
});
