import { describe, it, expect } from 'vitest';
import { shipping } from './shipping.js';

describe('shipping', () => {
  describe('ocean FCL', () => {
    it('should calculate base rate for 20ft container', () => {
      const result = shipping({
        mode: 'ocean_fcl',
        weight: 5000,
        volume: 20,
      });

      expect(result).not.toBeNull();
      expect(result!.mode).toBe('ocean_fcl');
      expect(result!.tariff).toEqual({ basis: 'container', containerFt: 20, baseUsd: 1500, extraFromKg: 10000, extraUsdPerKg: 0.5 });
      expect(result!.estimatedCost).toBe(1500);
      expect(result!.transitDays).toEqual({ min: 20, max: 40 });
    });

    it('should add extra charge for heavy shipments', () => {
      const result = shipping({
        mode: 'ocean_fcl',
        weight: 15000, // Over 10000 kg
        volume: 30,
      });

      // Base 1500 + (15000-10000)*0.5 = 1500 + 2500 = 4000
      expect(result!.estimatedCost).toBe(4000);
    });

    it('should calculate volumetric weight', () => {
      const result = shipping({
        mode: 'ocean_fcl',
        weight: 1000,
        volume: 12, // 12 CBM
      });

      // W/M: 1 m³ counts as 1 tonne — 12 m³ = 12,000 kg (not the air factor's 2,000)
      expect(result!.volumetricWeight).toBe(12000);
    });
  });

  describe('ocean LCL', () => {
    it('should charge by CBM when higher', () => {
      const result = shipping({
        mode: 'ocean_lcl',
        weight: 100,
        volume: 5, // 5 CBM = $250
      });

      expect(result!.mode).toBe('ocean_lcl');
      expect(result!.tariff).toMatchObject({ basis: 'revenue_tonne', usdPerRevenueTonne: 50, minimumUsd: 100 });
      expect(result!.estimatedCost).toBe(250); // 5 * 50
      expect(result!.transitDays).toEqual({ min: 25, max: 45 });
    });

    it('should charge by weight when higher', () => {
      const result = shipping({
        mode: 'ocean_lcl',
        weight: 4000, // 4 revenue tonnes by weight
        volume: 2, // 2 by measure
      });

      expect(result!.estimatedCost).toBe(200); // W/M: 4 × $50
    });

    it('counts 1 m³ as 1 tonne (W/M), not the air factor', () => {
      const result = shipping({ mode: 'ocean_lcl', weight: 500, volume: 2 });
      expect(result!.volumetricWeight).toBe(2000);
      expect(result!.chargeableWeight).toBe(2000);
      expect(result!.estimatedCost).toBe(100); // 2 revenue tonnes × $50
    });

    it('should apply minimum charge', () => {
      const result = shipping({
        mode: 'ocean_lcl',
        weight: 50,
        volume: 1,
      });

      expect(result!.estimatedCost).toBe(100); // Minimum
    });
  });

  describe('air freight', () => {
    it('should calculate volumetric weight correctly', () => {
      const result = shipping({
        mode: 'air',
        weight: 100,
        volume: 1, // 1 CBM = 167 kg volumetric
      });

      expect(result!.mode).toBe('air');
      expect(result!.tariff).toEqual({ basis: 'chargeable_weight', usdPerKg: 3.5, volumetricKgPerM3: 167 });
      expect(result!.volumetricWeight).toBe(167);
      expect(result!.chargeableWeight).toBe(167);
      expect(result!.transitDays).toEqual({ min: 3, max: 7 });
    });

    it('should use actual weight when higher', () => {
      const result = shipping({
        mode: 'air',
        weight: 500,
        volume: 1, // 167 kg volumetric
      });

      expect(result!.chargeableWeight).toBe(500);
      expect(result!.estimatedCost).toBe(1750); // 500 * 3.5
    });

    it('should use volumetric weight when higher', () => {
      const result = shipping({
        mode: 'air',
        weight: 100,
        volume: 2, // 334 kg volumetric
      });

      expect(result!.chargeableWeight).toBe(334);
      expect(result!.estimatedCost).toBe(1169); // 334 * 3.5
    });
  });

  describe('express courier', () => {
    it('should use higher volumetric factor', () => {
      const result = shipping({
        mode: 'express',
        weight: 50,
        volume: 0.5, // 0.5 CBM = 100 kg volumetric
      });

      expect(result!.mode).toBe('express');
      expect(result!.tariff).toEqual({ basis: 'chargeable_weight', usdPerKg: 8, volumetricKgPerM3: 200, minimumUsd: 50 });
      expect(result!.volumetricWeight).toBe(100);
      expect(result!.chargeableWeight).toBe(100);
      expect(result!.transitDays).toEqual({ min: 2, max: 5 });
    });

    it('should apply minimum charge', () => {
      const result = shipping({
        mode: 'express',
        weight: 1,
        volume: 0.01,
      });

      expect(result!.estimatedCost).toBe(50); // Minimum
    });

    it('should calculate rate per kg', () => {
      const result = shipping({
        mode: 'express',
        weight: 20,
        volume: 0.05, // 10 kg volumetric
      });

      expect(result!.chargeableWeight).toBe(20);
      expect(result!.estimatedCost).toBe(160); // 20 * 8
    });
  });

  describe('truck', () => {
    it('should calculate based on distance and weight', () => {
      const result = shipping({
        mode: 'truck',
        weight: 1000,
        volume: 2,
        distance: 500,
      });

      expect(result!.mode).toBe('truck');
      expect(result!.tariff).toMatchObject({ basis: 'distance_weight', usdPerKm: 1.5, usdPerKg: 0.02, kmPerDay: 500 });
      // Cost = 500 * 1.5 + 1000 * 0.02 = 750 + 20 = 770
      expect(result!.estimatedCost).toBe(770);
    });

    it('should calculate transit days based on distance', () => {
      const result = shipping({
        mode: 'truck',
        weight: 500,
        volume: 1,
        distance: 1200, // ~2.4 days
      });

      expect(result!.transitDays).toEqual({ min: 3, max: 4 });
    });

    it('should return 1 day for short distance', () => {
      const result = shipping({
        mode: 'truck',
        weight: 500,
        volume: 1,
        distance: 200,
      });

      expect(result!.transitDays).toEqual({ min: 1, max: 1 });
    });

    it('should throw for missing distance', () => {
      expect(() => shipping({
        mode: 'truck',
        weight: 500,
        volume: 1,
      })).toThrow(RangeError);
    });

    it('should throw for zero distance', () => {
      expect(() => shipping({
        mode: 'truck',
        weight: 500,
        volume: 1,
        distance: 0,
      })).toThrow(RangeError);
    });
  });

  describe('edge cases', () => {
    it('should throw for zero weight', () => {
      expect(() => shipping({
        mode: 'air',
        weight: 0,
        volume: 1,
      })).toThrow(RangeError);
    });

    it('should throw for zero volume', () => {
      expect(() => shipping({
        mode: 'air',
        weight: 100,
        volume: 0,
      })).toThrow(RangeError);
    });

    it('should throw for negative weight', () => {
      expect(() => shipping({
        mode: 'ocean_fcl',
        weight: -100,
        volume: 5,
      })).toThrow(RangeError);
    });

    it('should throw for invalid mode', () => {
      expect(() => shipping({
        mode: 'invalid' as any,
        weight: 100,
        volume: 1,
      })).toThrow(RangeError);
    });
  });

  describe('cost per kg calculation', () => {
    it('should calculate cost per kg for air freight', () => {
      const result = shipping({
        mode: 'air',
        weight: 200,
        volume: 0.5, // 83.5 kg volumetric
      });

      expect(result!.costPerKg).toBe(3.5); // Rate is $3.5/kg
    });

    it('should calculate cost per kg for ocean LCL', () => {
      const result = shipping({
        mode: 'ocean_lcl',
        weight: 1000,
        volume: 5,
      });

      // Cost = 5 revenue tonnes × $50 = 250, chargeable = max(1000, 5000) = 5000
      expect(result!.costPerKg).toBe(0.05);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate electronics shipment by air', () => {
      const result = shipping({
        mode: 'air',
        weight: 300,
        volume: 1.5, // Moderately packed electronics
      });

      expect(result!.chargeableWeight).toBeGreaterThan(0);
      expect(result!.estimatedCost).toBeGreaterThan(0);
      expect(result!.transitDays).toEqual({ min: 3, max: 7 });
    });

    it('should calculate furniture by ocean', () => {
      const result = shipping({
        mode: 'ocean_lcl',
        weight: 800,
        volume: 10, // Bulky furniture
      });

      // Should be charged by volume
      expect(result!.estimatedCost).toBe(500); // 10 * 50
    });

    it('should calculate full container for bulk goods', () => {
      const result = shipping({
        mode: 'ocean_fcl',
        weight: 18000,
        volume: 30,
      });

      // Base 1500 + (18000-10000)*0.5 = 1500 + 4000 = 5500
      expect(result!.estimatedCost).toBe(5500);
    });

    it('should calculate regional truck delivery', () => {
      const result = shipping({
        mode: 'truck',
        weight: 2000,
        volume: 4,
        distance: 300,
      });

      // 300*1.5 + 2000*0.02 = 450 + 40 = 490
      expect(result!.estimatedCost).toBe(490);
    });
  });
});

describe('shipping coded refusals', () => {
  it('codes an unknown shipping mode', () => {
    expect(() => shipping({ mode: 'rail' as never, weight: 500, volume: 1 })).toThrow(expect.objectContaining({ code: 'unknown_option', parameter: 'mode', got: 'rail' }));
  });
});
