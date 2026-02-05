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
      expect(result!.mode).toBe('Ocean FCL (20ft)');
      expect(result!.estimatedCost).toBe(1500);
      expect(result!.transitDays).toBe('20-40 days');
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

      // Volumetric = (12 * 1000) / 6 = 2000
      expect(result!.volumetricWeight).toBe(2000);
    });
  });

  describe('ocean LCL', () => {
    it('should charge by CBM when higher', () => {
      const result = shipping({
        mode: 'ocean_lcl',
        weight: 100,
        volume: 5, // 5 CBM = $250
      });

      expect(result!.mode).toBe('Ocean LCL');
      expect(result!.estimatedCost).toBe(250); // 5 * 50
      expect(result!.transitDays).toBe('25-45 days');
    });

    it('should charge by weight when higher', () => {
      const result = shipping({
        mode: 'ocean_lcl',
        weight: 2000, // $300 by weight
        volume: 2, // $100 by CBM
      });

      expect(result!.estimatedCost).toBe(300); // 2000 * 0.15
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

      expect(result!.mode).toBe('Air Freight');
      expect(result!.volumetricWeight).toBe(167);
      expect(result!.chargeableWeight).toBe(167);
      expect(result!.transitDays).toBe('3-7 days');
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

      expect(result!.mode).toBe('Express Courier');
      expect(result!.volumetricWeight).toBe(100);
      expect(result!.chargeableWeight).toBe(100);
      expect(result!.transitDays).toBe('2-5 days');
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

      expect(result!.mode).toBe('Truck');
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

      expect(result!.transitDays).toBe('3-4 days');
    });

    it('should return 1 day for short distance', () => {
      const result = shipping({
        mode: 'truck',
        weight: 500,
        volume: 1,
        distance: 200,
      });

      expect(result!.transitDays).toBe('1 day');
    });

    it('should return null for missing distance', () => {
      const result = shipping({
        mode: 'truck',
        weight: 500,
        volume: 1,
      });

      expect(result).toBeNull();
    });

    it('should return null for zero distance', () => {
      const result = shipping({
        mode: 'truck',
        weight: 500,
        volume: 1,
        distance: 0,
      });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return null for zero weight', () => {
      const result = shipping({
        mode: 'air',
        weight: 0,
        volume: 1,
      });

      expect(result).toBeNull();
    });

    it('should return null for zero volume', () => {
      const result = shipping({
        mode: 'air',
        weight: 100,
        volume: 0,
      });

      expect(result).toBeNull();
    });

    it('should return null for negative weight', () => {
      const result = shipping({
        mode: 'ocean_fcl',
        weight: -100,
        volume: 5,
      });

      expect(result).toBeNull();
    });

    it('should return null for invalid mode', () => {
      const result = shipping({
        mode: 'invalid' as any,
        weight: 100,
        volume: 1,
      });

      expect(result).toBeNull();
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

      // Cost = 250, chargeable = max(1000, 833.33) = 1000
      expect(result!.costPerKg).toBe(0.25);
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
      expect(result!.transitDays).toBe('3-7 days');
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
