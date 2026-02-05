import { describe, it, expect } from 'vitest';
import { aql } from './aql.js';

describe('aql', () => {
  describe('basic sampling plan', () => {
    it('should return sample code and size for small lot (lotSize=100, AQL=1.0, Level II)', () => {
      const result = aql({
        lotSize: 100,
        aqlLevel: 1.0,
        inspectionLevel: 'II',
      });

      // Lot size 100 falls in 91-150 range, Level II → Code F
      expect(result.sampleCode).toBe('F');
      expect(result.sampleSize).toBe(20);
      expect(result.acceptNumber).toBe(1);
      expect(result.rejectNumber).toBe(2);
    });

    it('should return sample code and size for medium lot (lotSize=1000, AQL=2.5, Level II)', () => {
      const result = aql({
        lotSize: 1000,
        aqlLevel: 2.5,
        inspectionLevel: 'II',
      });

      expect(result.sampleCode).toBe('J');
      expect(result.sampleSize).toBe(80);
      expect(result.acceptNumber).toBe(7);
      expect(result.rejectNumber).toBe(8);
    });

    it('should return sample code and size for large lot (lotSize=10000, AQL=4.0, Level II)', () => {
      const result = aql({
        lotSize: 10000,
        aqlLevel: 4.0,
        inspectionLevel: 'II',
      });

      expect(result.sampleCode).toBe('L');
      expect(result.sampleSize).toBe(200);
      expect(result.acceptNumber).toBe(21);
      expect(result.rejectNumber).toBe(22);
    });
  });

  describe('inspection levels', () => {
    it('should use smaller sample for reduced inspection (Level I)', () => {
      const result = aql({
        lotSize: 500,
        aqlLevel: 1.0,
        inspectionLevel: 'I',
      });

      expect(result.sampleCode).toBe('F');
      expect(result.sampleSize).toBe(20);
    });

    it('should use larger sample for tightened inspection (Level III)', () => {
      const result = aql({
        lotSize: 500,
        aqlLevel: 1.0,
        inspectionLevel: 'III',
      });

      expect(result.sampleCode).toBe('J');
      expect(result.sampleSize).toBe(80);
    });

    it('should use special inspection level S-1', () => {
      const result = aql({
        lotSize: 500,
        aqlLevel: 1.0,
        inspectionLevel: 'S-1',
      });

      expect(result.sampleCode).toBe('A');
      expect(result.sampleSize).toBe(2);
    });

    it('should use special inspection level S-4', () => {
      const result = aql({
        lotSize: 500,
        aqlLevel: 1.0,
        inspectionLevel: 'S-4',
      });

      expect(result.sampleCode).toBe('E');
      expect(result.sampleSize).toBe(13);
    });
  });

  describe('AQL levels', () => {
    it('should handle very low AQL (0.065)', () => {
      const result = aql({
        lotSize: 1000,
        aqlLevel: 0.065,
        inspectionLevel: 'II',
      });

      expect(result.acceptNumber).toBe(0);
      expect(result.rejectNumber).toBe(1);
    });

    it('should handle high AQL (6.5)', () => {
      const result = aql({
        lotSize: 1000,
        aqlLevel: 6.5,
        inspectionLevel: 'II',
      });

      expect(result.acceptNumber).toBe(14);
      expect(result.rejectNumber).toBe(15);
    });
  });

  describe('sampling percent', () => {
    it('should calculate sampling percent correctly', () => {
      const result = aql({
        lotSize: 1000,
        aqlLevel: 1.0,
        inspectionLevel: 'II',
      });

      // Sample size 80 / lot size 1000 = 8%
      expect(result.samplingPercent).toBe(8);
    });

    it('should cap sample size at lot size for small lots', () => {
      const result = aql({
        lotSize: 5,
        aqlLevel: 1.0,
        inspectionLevel: 'II',
      });

      // Sample size should not exceed lot size
      expect(result.sampleSize).toBe(2);
      expect(result.samplingPercent).toBe(40);
    });
  });

  describe('edge cases', () => {
    it('should return zeros for zero lot size', () => {
      const result = aql({
        lotSize: 0,
        aqlLevel: 1.0,
        inspectionLevel: 'II',
      });

      expect(result.sampleCode).toBe('-');
      expect(result.sampleSize).toBe(0);
      expect(result.samplingPercent).toBe(0);
    });

    it('should return zeros for negative lot size', () => {
      const result = aql({
        lotSize: -100,
        aqlLevel: 1.0,
        inspectionLevel: 'II',
      });

      expect(result.sampleCode).toBe('-');
      expect(result.sampleSize).toBe(0);
    });

    it('should return zeros for negative AQL level', () => {
      const result = aql({
        lotSize: 100,
        aqlLevel: -1.0,
        inspectionLevel: 'II',
      });

      expect(result.sampleCode).toBe('-');
      expect(result.sampleSize).toBe(0);
    });

    it('should handle very large lot sizes', () => {
      const result = aql({
        lotSize: 1000000,
        aqlLevel: 1.0,
        inspectionLevel: 'II',
      });

      expect(result.sampleCode).toBe('Q');
      expect(result.sampleSize).toBe(1250);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for electronics manufacturing (10000 units, AQL 0.25)', () => {
      const result = aql({
        lotSize: 10000,
        aqlLevel: 0.25,
        inspectionLevel: 'II',
      });

      expect(result.sampleCode).toBe('L');
      expect(result.acceptNumber).toBe(2);
      expect(result.rejectNumber).toBe(3);
    });

    it('should calculate for pharmaceutical (150 units, AQL 0.1)', () => {
      const result = aql({
        lotSize: 150,
        aqlLevel: 0.1,
        inspectionLevel: 'II',
      });

      expect(result.sampleCode).toBe('F');
      expect(result.acceptNumber).toBe(0);
      expect(result.rejectNumber).toBe(1);
    });
  });
});
