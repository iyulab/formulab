import { describe, it, expect } from 'vitest';
import { expiry } from './expiry.js';

describe('expiry', () => {
  describe('calculateExpiry mode', () => {
    it('should calculate expiry date from production date and shelf life', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2025-01-01',
        shelfLifeDays: 30,
        expiryDate: '',
        today: '2025-01-15',
      });

      expect(result.expiryDate).toBe('2025-01-31');
      expect(result.shelfLifeDays).toBe(30);
    });

    it('should calculate remaining days correctly', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2025-01-01',
        shelfLifeDays: 30,
        expiryDate: '',
        today: '2025-01-15',
      });

      // Jan 15 to Jan 31 = 16 days
      expect(result.remainingDays).toBe(16);
      expect(result.isExpired).toBe(false);
    });

    it('should detect expired products', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2025-01-01',
        shelfLifeDays: 10,
        expiryDate: '',
        today: '2025-01-15',
      });

      // Expiry: Jan 11, today: Jan 15, so expired
      expect(result.expiryDate).toBe('2025-01-11');
      expect(result.remainingDays).toBe(-4);
      expect(result.isExpired).toBe(true);
    });

    it('should calculate percent used correctly', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2025-01-01',
        shelfLifeDays: 20,
        expiryDate: '',
        today: '2025-01-11',
      });

      // 10 days used of 20, so 50%
      expect(result.percentUsed).toBe(50);
    });
  });

  describe('calculateRemaining mode', () => {
    it('should calculate remaining days from expiry date', () => {
      const result = expiry({
        mode: 'calculateRemaining',
        productionDate: '2025-01-01',
        shelfLifeDays: 0,
        expiryDate: '2025-01-31',
        today: '2025-01-15',
      });

      expect(result.remainingDays).toBe(16);
      expect(result.isExpired).toBe(false);
    });

    it('should calculate total shelf life from dates', () => {
      const result = expiry({
        mode: 'calculateRemaining',
        productionDate: '2025-01-01',
        shelfLifeDays: 0,
        expiryDate: '2025-01-31',
        today: '2025-01-15',
      });

      expect(result.shelfLifeDays).toBe(30);
    });

    it('should detect expired in remaining mode', () => {
      const result = expiry({
        mode: 'calculateRemaining',
        productionDate: '2025-01-01',
        shelfLifeDays: 0,
        expiryDate: '2025-01-10',
        today: '2025-01-15',
      });

      expect(result.remainingDays).toBe(-5);
      expect(result.isExpired).toBe(true);
    });

    it('should calculate percent used in remaining mode', () => {
      const result = expiry({
        mode: 'calculateRemaining',
        productionDate: '2025-01-01',
        shelfLifeDays: 0,
        expiryDate: '2025-01-21',
        today: '2025-01-11',
      });

      // Total: 20 days, used: 10 days, so 50%
      expect(result.percentUsed).toBe(50);
    });
  });

  describe('edge cases', () => {
    it('should handle zero remaining days (expiry today)', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2025-01-01',
        shelfLifeDays: 15,
        expiryDate: '',
        today: '2025-01-16',
      });

      expect(result.remainingDays).toBe(0);
      expect(result.isExpired).toBe(false);
    });

    it('should clamp percent used at 0', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2025-01-15',
        shelfLifeDays: 30,
        expiryDate: '',
        today: '2025-01-10',  // Before production
      });

      expect(result.percentUsed).toBe(0);
    });

    it('should clamp percent used at 100', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2025-01-01',
        shelfLifeDays: 10,
        expiryDate: '',
        today: '2025-01-20',  // Way past expiry
      });

      expect(result.percentUsed).toBe(100);
    });

    it('should handle zero shelf life days', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2025-01-01',
        shelfLifeDays: 0,
        expiryDate: '',
        today: '2025-01-01',
      });

      expect(result.expiryDate).toBe('2025-01-01');
      expect(result.percentUsed).toBe(100);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle milk shelf life (7 days)', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2025-02-01',
        shelfLifeDays: 7,
        expiryDate: '',
        today: '2025-02-05',
      });

      expect(result.expiryDate).toBe('2025-02-08');
      expect(result.remainingDays).toBe(3);
      // 4 days used of 7, so 57.1%
      expect(result.percentUsed).toBeCloseTo(57.1, 0);
    });

    it('should handle canned goods (2 years)', () => {
      const result = expiry({
        mode: 'calculateExpiry',
        productionDate: '2024-01-01',
        shelfLifeDays: 730,  // 2 years
        expiryDate: '',
        today: '2025-01-01',
      });

      // 2024 is leap year: 2024-01-01 + 730 = 2025-12-31
      // From 2025-01-01 to 2025-12-31 = 364 days
      expect(result.remainingDays).toBe(364);
      expect(result.percentUsed).toBe(50.1);
    });

    it('should handle frozen food (6 months)', () => {
      const result = expiry({
        mode: 'calculateRemaining',
        productionDate: '2025-01-01',
        shelfLifeDays: 0,
        expiryDate: '2025-07-01',
        today: '2025-04-01',
      });

      expect(result.shelfLifeDays).toBe(181);
      expect(result.remainingDays).toBe(91);
    });
  });
});
