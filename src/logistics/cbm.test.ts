import { describe, it, expect } from 'vitest';
import { cbm } from './cbm.js';

describe('cbm', () => {
  describe('unit conversion', () => {
    it('should calculate CBM from centimeters', () => {
      const result = cbm({
        length: 100,
        width: 50,
        height: 40,
        quantity: 1,
        unit: 'cm',
      });

      // 100cm × 50cm × 40cm = 1m × 0.5m × 0.4m = 0.2 m³
      expect(result.cbmPerUnit).toBeCloseTo(0.2, 4);
      expect(result.totalCbm).toBeCloseTo(0.2, 4);
    });

    it('should calculate CBM from millimeters', () => {
      const result = cbm({
        length: 1000,
        width: 500,
        height: 400,
        quantity: 1,
        unit: 'mm',
      });

      // 1000mm × 500mm × 400mm = 1m × 0.5m × 0.4m = 0.2 m³
      expect(result.cbmPerUnit).toBeCloseTo(0.2, 4);
    });

    it('should calculate CBM from meters', () => {
      const result = cbm({
        length: 1,
        width: 0.5,
        height: 0.4,
        quantity: 1,
        unit: 'm',
      });

      expect(result.cbmPerUnit).toBeCloseTo(0.2, 4);
    });
  });

  describe('quantity handling', () => {
    it('should multiply by quantity for total CBM', () => {
      const result = cbm({
        length: 100,
        width: 50,
        height: 40,
        quantity: 10,
        unit: 'cm',
      });

      // Single unit = 0.2 m³
      // Total = 0.2 × 10 = 2.0 m³
      expect(result.cbmPerUnit).toBeCloseTo(0.2, 4);
      expect(result.totalCbm).toBeCloseTo(2.0, 4);
    });

    it('should handle large quantities', () => {
      const result = cbm({
        length: 30,
        width: 20,
        height: 15,
        quantity: 1000,
        unit: 'cm',
      });

      // Single unit = 0.3m × 0.2m × 0.15m = 0.009 m³
      // Total = 0.009 × 1000 = 9.0 m³
      expect(result.cbmPerUnit).toBeCloseTo(0.009, 4);
      expect(result.totalCbm).toBeCloseTo(9.0, 2);
    });
  });

  describe('shipping container scenarios', () => {
    it('should calculate 20ft container capacity check', () => {
      // 20ft container inner dimensions: ~5.9m × 2.35m × 2.39m ≈ 33.2 m³
      // Carton: 60cm × 40cm × 40cm = 0.096 m³
      const carton = cbm({
        length: 60,
        width: 40,
        height: 40,
        quantity: 1,
        unit: 'cm',
      });

      expect(carton.cbmPerUnit).toBeCloseTo(0.096, 4);

      // How many cartons fit? ~33.2 / 0.096 ≈ 345 (theoretical max)
      const fullLoad = cbm({
        length: 60,
        width: 40,
        height: 40,
        quantity: 300,
        unit: 'cm',
      });

      expect(fullLoad.totalCbm).toBeCloseTo(28.8, 1);
    });

    it('should calculate pallet-based shipment', () => {
      // Standard Euro pallet with boxes stacked 1.5m high
      // 120cm × 80cm × 150cm
      const pallet = cbm({
        length: 120,
        width: 80,
        height: 150,
        quantity: 20, // 20 pallets
        unit: 'cm',
      });

      // Single pallet = 1.2 × 0.8 × 1.5 = 1.44 m³
      // Total = 1.44 × 20 = 28.8 m³
      expect(pallet.cbmPerUnit).toBeCloseTo(1.44, 4);
      expect(pallet.totalCbm).toBeCloseTo(28.8, 2);
    });
  });

  describe('precision', () => {
    it('should maintain precision for small items', () => {
      const result = cbm({
        length: 10,
        width: 5,
        height: 3,
        quantity: 1,
        unit: 'cm',
      });

      // 0.1m × 0.05m × 0.03m = 0.00015 m³
      expect(result.cbmPerUnit).toBeCloseTo(0.00015, 6);
    });

    it('should handle very small dimensions', () => {
      const result = cbm({
        length: 50,
        width: 30,
        height: 20,
        quantity: 1,
        unit: 'mm',
      });

      // 0.05m × 0.03m × 0.02m = 0.00003 m³
      expect(result.cbmPerUnit).toBeCloseTo(0.00003, 6);
    });
  });

  describe('edge cases', () => {
    it('should handle zero dimensions', () => {
      const result = cbm({
        length: 0,
        width: 50,
        height: 40,
        quantity: 1,
        unit: 'cm',
      });

      expect(result.cbmPerUnit).toBe(0);
      expect(result.totalCbm).toBe(0);
    });

    it('should handle zero quantity', () => {
      const result = cbm({
        length: 100,
        width: 50,
        height: 40,
        quantity: 0,
        unit: 'cm',
      });

      expect(result.cbmPerUnit).toBeCloseTo(0.2, 4);
      expect(result.totalCbm).toBe(0);
    });
  });
});
