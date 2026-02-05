import { describe, it, expect } from 'vitest';
import { formwork } from './formwork.js';

describe('formwork', () => {
  describe('column formwork', () => {
    it('should calculate area for all 4 sides', () => {
      const result = formwork({
        elementType: 'column',
        length: 0.4, // 400mm
        width: 0.4,
        height: 3, // 3m
        quantity: 1,
        reuses: 1,
      });

      // Area = 2(L+W) × H = 2(0.4+0.4) × 3 = 4.8 m²
      expect(result.singleAreaSqm).toBe(4.8);
    });

    it('should handle rectangular columns', () => {
      const result = formwork({
        elementType: 'column',
        length: 0.6,
        width: 0.3,
        height: 3.5,
        quantity: 1,
        reuses: 1,
      });

      // Area = 2(0.6+0.3) × 3.5 = 2(0.9) × 3.5 = 6.3 m²
      expect(result.singleAreaSqm).toBe(6.3);
    });
  });

  describe('beam formwork', () => {
    it('should calculate 2 sides plus bottom', () => {
      const result = formwork({
        elementType: 'beam',
        length: 5, // 5m span
        width: 0.3, // 300mm
        height: 0.5, // 500mm depth
        quantity: 1,
        reuses: 1,
      });

      // Area = 2×H×L + W×L = 2×0.5×5 + 0.3×5 = 5 + 1.5 = 6.5 m²
      expect(result.singleAreaSqm).toBe(6.5);
    });
  });

  describe('slab formwork', () => {
    it('should calculate bottom only', () => {
      const result = formwork({
        elementType: 'slab',
        length: 6,
        width: 4,
        height: 0.15, // height not used for slab area
        quantity: 1,
        reuses: 1,
      });

      // Area = L × W = 6 × 4 = 24 m²
      expect(result.singleAreaSqm).toBe(24);
    });
  });

  describe('wall formwork', () => {
    it('should calculate 2 sides', () => {
      const result = formwork({
        elementType: 'wall',
        length: 8,
        width: 0.2, // width not used
        height: 3,
        quantity: 1,
        reuses: 1,
      });

      // Area = 2 × L × H = 2 × 8 × 3 = 48 m²
      expect(result.singleAreaSqm).toBe(48);
    });
  });

  describe('footing formwork', () => {
    it('should calculate 4 sides', () => {
      const result = formwork({
        elementType: 'footing',
        length: 1.5,
        width: 1.5,
        height: 0.3,
        quantity: 1,
        reuses: 1,
      });

      // Area = 2(L+W) × H = 2(1.5+1.5) × 0.3 = 1.8 m²
      expect(result.singleAreaSqm).toBe(1.8);
    });
  });

  describe('quantity multiplier', () => {
    it('should multiply by quantity', () => {
      const result = formwork({
        elementType: 'column',
        length: 0.4,
        width: 0.4,
        height: 3,
        quantity: 10,
        reuses: 1,
      });

      // Single = 4.8, Total = 4.8 × 10 = 48 m²
      expect(result.singleAreaSqm).toBe(4.8);
      expect(result.totalAreaSqm).toBe(48);
    });
  });

  describe('reuse factor', () => {
    it('should reduce effective area with reuses', () => {
      const result = formwork({
        elementType: 'column',
        length: 0.4,
        width: 0.4,
        height: 3,
        quantity: 20,
        reuses: 4,
      });

      // Total = 4.8 × 20 = 96 m²
      // Effective = 96 / 4 = 24 m²
      expect(result.totalAreaSqm).toBe(96);
      expect(result.effectiveAreaSqm).toBe(24);
    });

    it('should treat zero reuses as 1', () => {
      const result = formwork({
        elementType: 'column',
        length: 0.4,
        width: 0.4,
        height: 3,
        quantity: 5,
        reuses: 0,
      });

      expect(result.effectiveAreaSqm).toBe(result.totalAreaSqm);
    });
  });

  describe('plywood sheets calculation', () => {
    it('should calculate sheets needed', () => {
      const result = formwork({
        elementType: 'slab',
        length: 10,
        width: 8,
        height: 0.15,
        quantity: 1,
        reuses: 1,
      });

      // Effective area = 80 m²
      // Sheet area = 2.9768 m²
      // Sheets = ceil(80 / 2.9768) = 27
      expect(result.effectiveAreaSqm).toBe(80);
      expect(result.plywoodSheets).toBe(27);
    });

    it('should round up partial sheets', () => {
      const result = formwork({
        elementType: 'column',
        length: 0.4,
        width: 0.4,
        height: 3,
        quantity: 1,
        reuses: 1,
      });

      // Effective area = 4.8 m²
      // Sheets = ceil(4.8 / 2.9768) = 2
      expect(result.plywoodSheets).toBe(2);
    });

    it('should return 0 sheets for zero area', () => {
      const result = formwork({
        elementType: 'slab',
        length: 0,
        width: 5,
        height: 0.15,
        quantity: 1,
        reuses: 1,
      });

      expect(result.singleAreaSqm).toBe(0);
      expect(result.plywoodSheets).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for high-rise building floor (30 columns)', () => {
      const result = formwork({
        elementType: 'column',
        length: 0.5,
        width: 0.5,
        height: 3.2,
        quantity: 30,
        reuses: 5,
      });

      // Single = 2(1.0) × 3.2 = 6.4 m²
      // Total = 6.4 × 30 = 192 m²
      // Effective = 192 / 5 = 38.4 m²
      expect(result.totalAreaSqm).toBe(192);
      expect(result.effectiveAreaSqm).toBe(38.4);
    });

    it('should calculate for basement wall', () => {
      const result = formwork({
        elementType: 'wall',
        length: 50, // perimeter
        width: 0.3,
        height: 2.7,
        quantity: 1,
        reuses: 1,
      });

      // Area = 2 × 50 × 2.7 = 270 m²
      expect(result.totalAreaSqm).toBe(270);
    });

    it('should calculate for strip footing', () => {
      const result = formwork({
        elementType: 'footing',
        length: 30, // total length
        width: 0.6,
        height: 0.4,
        quantity: 1,
        reuses: 1,
      });

      // Area = 2(30+0.6) × 0.4 = 24.48 m²
      expect(result.singleAreaSqm).toBeCloseTo(24.48, 1);
    });
  });
});
