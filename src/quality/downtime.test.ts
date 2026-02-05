import { describe, it, expect } from 'vitest';
import { downtime } from './downtime.js';

describe('downtime', () => {
  describe('basic calculations', () => {
    it('should convert minutes to hours correctly', () => {
      const result = downtime({
        hourlyRate: 100,
        laborCostPerHour: 50,
        downtimeMinutes: 120,
        plannedProductionUnits: 100,
        unitPrice: 10,
      });

      expect(result.downtimeHours).toBe(2);
    });

    it('should calculate labor cost correctly', () => {
      const result = downtime({
        hourlyRate: 100,
        laborCostPerHour: 50,
        downtimeMinutes: 60,
        plannedProductionUnits: 100,
        unitPrice: 10,
      });

      // Labor cost = 50 * 1 = 50
      expect(result.laborCost).toBe(50);
    });

    it('should calculate equipment cost correctly', () => {
      const result = downtime({
        hourlyRate: 100,
        laborCostPerHour: 50,
        downtimeMinutes: 60,
        plannedProductionUnits: 100,
        unitPrice: 10,
      });

      // Equipment cost = 100 * 1 = 100
      expect(result.equipmentCost).toBe(100);
    });

    it('should calculate lost units correctly', () => {
      const result = downtime({
        hourlyRate: 100,
        laborCostPerHour: 50,
        downtimeMinutes: 60,
        plannedProductionUnits: 100,
        unitPrice: 10,
      });

      // Lost units = 100 * 1 = 100
      expect(result.lostUnits).toBe(100);
    });

    it('should calculate lost revenue correctly', () => {
      const result = downtime({
        hourlyRate: 100,
        laborCostPerHour: 50,
        downtimeMinutes: 60,
        plannedProductionUnits: 100,
        unitPrice: 10,
      });

      // Lost revenue = 100 * 10 = 1000
      expect(result.lostRevenue).toBe(1000);
    });

    it('should calculate total cost correctly', () => {
      const result = downtime({
        hourlyRate: 100,
        laborCostPerHour: 50,
        downtimeMinutes: 60,
        plannedProductionUnits: 100,
        unitPrice: 10,
      });

      // Total = labor + equipment + lost revenue = 50 + 100 + 1000 = 1150
      expect(result.totalCost).toBe(1150);
    });
  });

  describe('partial hours', () => {
    it('should handle 30 minutes (0.5 hours)', () => {
      const result = downtime({
        hourlyRate: 200,
        laborCostPerHour: 100,
        downtimeMinutes: 30,
        plannedProductionUnits: 60,
        unitPrice: 5,
      });

      expect(result.downtimeHours).toBe(0.5);
      expect(result.laborCost).toBe(50);
      expect(result.equipmentCost).toBe(100);
      expect(result.lostUnits).toBe(30);
      expect(result.lostRevenue).toBe(150);
    });

    it('should handle 15 minutes (0.25 hours)', () => {
      const result = downtime({
        hourlyRate: 400,
        laborCostPerHour: 200,
        downtimeMinutes: 15,
        plannedProductionUnits: 40,
        unitPrice: 25,
      });

      expect(result.downtimeHours).toBe(0.25);
      expect(result.laborCost).toBe(50);
      expect(result.equipmentCost).toBe(100);
      expect(result.lostUnits).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle zero downtime', () => {
      const result = downtime({
        hourlyRate: 100,
        laborCostPerHour: 50,
        downtimeMinutes: 0,
        plannedProductionUnits: 100,
        unitPrice: 10,
      });

      expect(result.downtimeHours).toBe(0);
      expect(result.laborCost).toBe(0);
      expect(result.equipmentCost).toBe(0);
      expect(result.lostUnits).toBe(0);
      expect(result.lostRevenue).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it('should handle zero rates', () => {
      const result = downtime({
        hourlyRate: 0,
        laborCostPerHour: 0,
        downtimeMinutes: 60,
        plannedProductionUnits: 100,
        unitPrice: 10,
      });

      expect(result.laborCost).toBe(0);
      expect(result.equipmentCost).toBe(0);
      expect(result.lostRevenue).toBe(1000);
      expect(result.totalCost).toBe(1000);
    });

    it('should handle zero production rate', () => {
      const result = downtime({
        hourlyRate: 100,
        laborCostPerHour: 50,
        downtimeMinutes: 60,
        plannedProductionUnits: 0,
        unitPrice: 10,
      });

      expect(result.lostUnits).toBe(0);
      expect(result.lostRevenue).toBe(0);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate cost for automotive assembly line (2 hour stoppage)', () => {
      const result = downtime({
        hourlyRate: 5000,
        laborCostPerHour: 2000,
        downtimeMinutes: 120,
        plannedProductionUnits: 30,
        unitPrice: 35000,
      });

      expect(result.downtimeHours).toBe(2);
      expect(result.lostUnits).toBe(60);
      expect(result.lostRevenue).toBe(2100000);
      expect(result.totalCost).toBe(2114000);
    });

    it('should calculate cost for electronics manufacturing (45 min)', () => {
      const result = downtime({
        hourlyRate: 800,
        laborCostPerHour: 400,
        downtimeMinutes: 45,
        plannedProductionUnits: 200,
        unitPrice: 50,
      });

      expect(result.downtimeHours).toBe(0.75);
      expect(result.lostUnits).toBe(150);
      expect(result.lostRevenue).toBe(7500);
    });

    it('should calculate cost for food processing (3 hour maintenance)', () => {
      const result = downtime({
        hourlyRate: 1500,
        laborCostPerHour: 600,
        downtimeMinutes: 180,
        plannedProductionUnits: 500,
        unitPrice: 15,
      });

      expect(result.downtimeHours).toBe(3);
      expect(result.lostUnits).toBe(1500);
      expect(result.lostRevenue).toBe(22500);
      expect(result.totalCost).toBe(28800);
    });
  });
});
