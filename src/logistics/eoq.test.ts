import { describe, it, expect } from 'vitest';
import { eoq } from './eoq.js';

describe('eoq', () => {
  describe('basic EOQ calculation', () => {
    it('should calculate EOQ correctly for standard inputs', () => {
      // D = 10000 units/year, S = $50/order, H = $5/unit/year
      // EOQ = sqrt(2 * 10000 * 50 / 5) = sqrt(200000) ≈ 447.21
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: 5,
      });

      expect(result.eoq).toBeCloseTo(447.21, 1);
    });

    it('should calculate orders per year correctly', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: 5,
      });

      // Orders per year = 10000 / 447.21 ≈ 22.36
      expect(result.ordersPerYear).toBeCloseTo(22.36, 1);
    });

    it('should calculate order cycle days correctly', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: 5,
      });

      // Order cycle = 365 / 22.36 ≈ 16.33 days
      expect(result.orderCycleDays).toBeCloseTo(16.33, 1);
    });
  });

  describe('cost calculations', () => {
    it('should calculate annual ordering cost correctly', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: 5,
      });

      // Annual ordering cost = (10000 / 447.21) * 50 ≈ 1118.03
      expect(result.annualOrderingCost).toBeCloseTo(1118.03, 0);
    });

    it('should calculate annual holding cost correctly', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: 5,
      });

      // Annual holding cost = (447.21 / 2) * 5 ≈ 1118.03
      expect(result.annualHoldingCost).toBeCloseTo(1118.03, 0);
    });

    it('should have equal ordering and holding costs at EOQ (optimal point)', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: 5,
      });

      // At EOQ, ordering cost = holding cost (this is the key property of EOQ)
      expect(result.annualOrderingCost).toBeCloseTo(result.annualHoldingCost, 0);
    });

    it('should calculate total annual cost correctly', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: 5,
      });

      expect(result.totalAnnualCost).toBeCloseTo(
        result.annualOrderingCost + result.annualHoldingCost,
        2
      );
    });
  });

  describe('different input scenarios', () => {
    it('should handle low demand correctly', () => {
      const result = eoq({
        annualDemand: 100,
        orderCost: 25,
        holdingCost: 2,
      });

      // EOQ = sqrt(2 * 100 * 25 / 2) = sqrt(2500) = 50
      expect(result.eoq).toBe(50);
    });

    it('should handle high holding cost (smaller EOQ)', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: 50, // 10x higher holding cost
      });

      // Higher holding cost → smaller EOQ
      // EOQ = sqrt(2 * 10000 * 50 / 50) = sqrt(20000) ≈ 141.42
      expect(result.eoq).toBeCloseTo(141.42, 1);
    });

    it('should handle high order cost (larger EOQ)', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 500, // 10x higher order cost
        holdingCost: 5,
      });

      // Higher order cost → larger EOQ
      // EOQ = sqrt(2 * 10000 * 500 / 5) = sqrt(2000000) ≈ 1414.21
      expect(result.eoq).toBeCloseTo(1414.21, 1);
    });
  });

  describe('input validation', () => {
    it('should return zeros for zero annual demand', () => {
      const result = eoq({
        annualDemand: 0,
        orderCost: 50,
        holdingCost: 5,
      });

      expect(result.eoq).toBe(0);
      expect(result.ordersPerYear).toBe(0);
      expect(result.totalAnnualCost).toBe(0);
    });

    it('should return zeros for negative annual demand', () => {
      const result = eoq({
        annualDemand: -1000,
        orderCost: 50,
        holdingCost: 5,
      });

      expect(result.eoq).toBe(0);
    });

    it('should return zeros for zero order cost', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 0,
        holdingCost: 5,
      });

      expect(result.eoq).toBe(0);
    });

    it('should return zeros for zero holding cost', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: 0,
      });

      expect(result.eoq).toBe(0);
    });

    it('should return zeros for negative holding cost', () => {
      const result = eoq({
        annualDemand: 10000,
        orderCost: 50,
        holdingCost: -5,
      });

      expect(result.eoq).toBe(0);
    });
  });

  describe('textbook examples', () => {
    it('should match textbook example 1', () => {
      // Classic example: D=1200, S=100, H=24
      // EOQ = sqrt(2*1200*100/24) = sqrt(10000) = 100
      const result = eoq({
        annualDemand: 1200,
        orderCost: 100,
        holdingCost: 24,
      });

      expect(result.eoq).toBe(100);
      expect(result.ordersPerYear).toBe(12);
      expect(result.orderCycleDays).toBeCloseTo(30.42, 1);
    });

    it('should match textbook example 2', () => {
      // D=5000, S=40, H=5
      // EOQ = sqrt(2*5000*40/5) = sqrt(80000) ≈ 282.84
      const result = eoq({
        annualDemand: 5000,
        orderCost: 40,
        holdingCost: 5,
      });

      expect(result.eoq).toBeCloseTo(282.84, 1);
    });
  });
});
