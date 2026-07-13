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
      // ISO 2859-1 Table 2-A: F at AQL 1.0 is an arrow cell → Ac 0 / Re 1
      expect(result.sampleCode).toBe('F');
      expect(result.sampleSize).toBe(20);
      expect(result.acceptNumber).toBe(0);
      expect(result.rejectNumber).toBe(1);
    });

    it('should return sample code and size for medium lot (lotSize=1000, AQL=2.5, Level II)', () => {
      const result = aql({
        lotSize: 1000,
        aqlLevel: 2.5,
        inspectionLevel: 'II',
      });

      // ISO 2859-1 Table 2-A: J (n=80) at AQL 2.5 → Ac 5 / Re 6
      expect(result.sampleCode).toBe('J');
      expect(result.sampleSize).toBe(80);
      expect(result.acceptNumber).toBe(5);
      expect(result.rejectNumber).toBe(6);
    });

    it('should return sample code and size for large lot (lotSize=10000, AQL=4.0, Level II)', () => {
      const result = aql({
        lotSize: 10000,
        aqlLevel: 4.0,
        inspectionLevel: 'II',
      });

      // ISO 2859-1 Table 2-A: L (n=200) at AQL 4.0 → Ac 14 / Re 15
      expect(result.sampleCode).toBe('L');
      expect(result.sampleSize).toBe(200);
      expect(result.acceptNumber).toBe(14);
      expect(result.rejectNumber).toBe(15);
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

      // ISO 2859-1 Table 1: lot 281-500 at S-1 → code B (n=3)
      expect(result.sampleCode).toBe('B');
      expect(result.sampleSize).toBe(3);
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

      // ISO 2859-1 Table 2-A: J (n=80) at AQL 6.5 → Ac 10 / Re 11
      expect(result.acceptNumber).toBe(10);
      expect(result.rejectNumber).toBe(11);
    });
  });

  describe('AQL substitution disclosure (ISSUE-20260713 silent clamp)', () => {
    it('no longer adjusts AQL 10 — it is a real table column since the 10/15/25 extension', () => {
      const result = aql({ lotSize: 1000, aqlLevel: 10, inspectionLevel: 'II' });

      expect(result.aqlUsed).toBe(10);
      expect(result.aqlAdjusted).toBe(false);
      // ISO 2859-1 Table 2-A: J (n=80) at AQL 10 → Ac 14 / Re 15
      expect(result.acceptNumber).toBe(14);
      expect(result.rejectNumber).toBe(15);
    });

    it('flags AQL 40 snapped down to the 25 column (embedded table now ends at 25)', () => {
      const result = aql({ lotSize: 1000, aqlLevel: 40, inspectionLevel: 'II' });

      expect(result.aqlUsed).toBe(25);
      expect(result.aqlAdjusted).toBe(true);
    });

    it('flags AQL below the table snapped UP to 0.065 (silently looser plan)', () => {
      const result = aql({ lotSize: 1000, aqlLevel: 0.01, inspectionLevel: 'II' });

      expect(result.aqlUsed).toBe(0.065);
      expect(result.aqlAdjusted).toBe(true);
    });

    it('flags non-preferred AQL between columns (5.0 → 4.0)', () => {
      const result = aql({ lotSize: 1000, aqlLevel: 5.0, inspectionLevel: 'II' });

      expect(result.aqlUsed).toBe(4.0);
      expect(result.aqlAdjusted).toBe(true);
    });

    it('does not flag exact column hits', () => {
      for (const level of [0.065, 0.4, 1.0, 2.5, 6.5, 10, 15, 25]) {
        const result = aql({ lotSize: 1000, aqlLevel: level, inspectionLevel: 'II' });
        expect(result.aqlUsed).toBe(level);
        expect(result.aqlAdjusted).toBe(false);
      }
    });

    it('marks the negative-AQL zero-plan sentinel as adjusted (aqlUsed 0)', () => {
      const result = aql({ lotSize: 100, aqlLevel: -1.0, inspectionLevel: 'II' });

      expect(result.aqlUsed).toBe(0);
      expect(result.aqlAdjusted).toBe(true);
    });
  });

  describe('ISO 2859-1 Table 2-A golden cells — AQL 10/15/25 extension', () => {
    // Transcribed from ISO 2859-1:1999(E) Table 2-A scan, cross-verified against
    // MIL-STD-105E Table II-A (identical master table). Arrow cells resolve per the
    // documented simplification (redirected Ac/Re with this letter's own sample size).
    it('direct cells on the diagonal', () => {
      // C (n=5, lot 25 @ II) at AQL 10 → Ac 1 / Re 2
      const c10 = aql({ lotSize: 25, aqlLevel: 10, inspectionLevel: 'II' });
      expect([c10.sampleCode, c10.acceptNumber, c10.rejectNumber]).toEqual(['C', 1, 2]);

      // F (n=20, lot 150 @ II) at AQL 15 → Ac 7 / Re 8
      const f15 = aql({ lotSize: 150, aqlLevel: 15, inspectionLevel: 'II' });
      expect([f15.sampleCode, f15.acceptNumber, f15.rejectNumber]).toEqual(['F', 7, 8]);

      // H (n=50, lot 500 @ II) at AQL 25 → Ac 21 / Re 22
      const h25 = aql({ lotSize: 500, aqlLevel: 25, inspectionLevel: 'II' });
      expect([h25.sampleCode, h25.acceptNumber, h25.rejectNumber]).toEqual(['H', 21, 22]);

      // K (n=125, lot 3200 @ II) at AQL 10 → Ac 21 / Re 22 (last direct cell in the column)
      const k10 = aql({ lotSize: 3200, aqlLevel: 10, inspectionLevel: 'II' });
      expect([k10.sampleCode, k10.acceptNumber, k10.rejectNumber]).toEqual(['K', 21, 22]);
    });

    it('down-arrow cells at the top of the columns (A/B at 10, A at 15 → redirected 1/2)', () => {
      // A (n=2, lot 8 @ S-1): AQL 10 is a down-arrow chain to C's 1/2
      const a10 = aql({ lotSize: 8, aqlLevel: 10, inspectionLevel: 'S-1' });
      expect([a10.sampleCode, a10.acceptNumber, a10.rejectNumber]).toEqual(['A', 1, 2]);

      // A at 25 is a DIRECT cell: 1/2 (first direct cell of the 25 column)
      const a25 = aql({ lotSize: 8, aqlLevel: 25, inspectionLevel: 'S-1' });
      expect([a25.acceptNumber, a25.rejectNumber]).toEqual([1, 2]);

      // B (n=3, lot 15 @ II) at 15 is a DIRECT cell: 1/2; at 25 direct: 2/3
      const b15 = aql({ lotSize: 15, aqlLevel: 15, inspectionLevel: 'II' });
      expect([b15.sampleCode, b15.acceptNumber, b15.rejectNumber]).toEqual(['B', 1, 2]);
      const b25 = aql({ lotSize: 15, aqlLevel: 25, inspectionLevel: 'II' });
      expect([b25.acceptNumber, b25.rejectNumber]).toEqual([2, 3]);
    });

    it('up-arrow cells below the last direct cell (J at 25, L at 10 → redirected 21/22)', () => {
      // J (n=80, lot 1000 @ II) at AQL 25 → up-arrow to H's 21/22
      const j25 = aql({ lotSize: 1000, aqlLevel: 25, inspectionLevel: 'II' });
      expect([j25.sampleCode, j25.acceptNumber, j25.rejectNumber]).toEqual(['J', 21, 22]);

      // L (n=200, lot 10000 @ II) at AQL 10 → up-arrow to K's 21/22
      const l10 = aql({ lotSize: 10000, aqlLevel: 10, inspectionLevel: 'II' });
      expect([l10.sampleCode, l10.acceptNumber, l10.rejectNumber]).toEqual(['L', 21, 22]);
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
    it('should throw for zero lot size', () => {
      expect(() => aql({
        lotSize: 0,
        aqlLevel: 1.0,
        inspectionLevel: 'II',
      })).toThrow();
    });

    it('should throw for negative lot size', () => {
      expect(() => aql({
        lotSize: -100,
        aqlLevel: 1.0,
        inspectionLevel: 'II',
      })).toThrow();
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

  describe('ISO 2859-1:1999 golden cells', () => {
    it('Table 1: lot 51-90 at S-1 → code B (was A before the S-column fix)', () => {
      const result = aql({ lotSize: 60, aqlLevel: 1.0, inspectionLevel: 'S-1' });
      expect(result.sampleCode).toBe('B');
      expect(result.sampleSize).toBe(3);
    });

    it('Table 1: lot 150001-500000 at S-3 → code G', () => {
      const result = aql({ lotSize: 200000, aqlLevel: 1.0, inspectionLevel: 'S-3' });
      expect(result.sampleCode).toBe('G');
      expect(result.sampleSize).toBe(32);
    });

    it('Table 1: lot 500001+ at S-3 → code H', () => {
      const result = aql({ lotSize: 600000, aqlLevel: 1.0, inspectionLevel: 'S-3' });
      expect(result.sampleCode).toBe('H');
      expect(result.sampleSize).toBe(50);
    });

    it('Table 2-A: K (n=125) at AQL 0.65 → Ac 2 / Re 3', () => {
      const result = aql({ lotSize: 2000, aqlLevel: 0.65, inspectionLevel: 'II' });
      expect(result.sampleCode).toBe('K');
      expect(result.acceptNumber).toBe(2);
      expect(result.rejectNumber).toBe(3);
    });

    it('Table 2-A: Q (n=1250) at AQL 0.15 → Ac 5 / Re 6 (0.15 level supported)', () => {
      const result = aql({ lotSize: 600000, aqlLevel: 0.15, inspectionLevel: 'II' });
      expect(result.sampleCode).toBe('Q');
      expect(result.acceptNumber).toBe(5);
      expect(result.rejectNumber).toBe(6);
    });

    it('Table 2-A: N (n=500) at AQL 1.0 → Ac 10 / Re 11', () => {
      const result = aql({ lotSize: 600000, aqlLevel: 1.0, inspectionLevel: 'I' });
      expect(result.sampleCode).toBe('N');
      expect(result.acceptNumber).toBe(10);
      expect(result.rejectNumber).toBe(11);
    });
  });

  describe('real-world scenarios', () => {
    it('should calculate for electronics manufacturing (10000 units, AQL 0.25)', () => {
      const result = aql({
        lotSize: 10000,
        aqlLevel: 0.25,
        inspectionLevel: 'II',
      });

      // ISO 2859-1 Table 2-A: L (n=200) at AQL 0.25 → Ac 1 / Re 2
      expect(result.sampleCode).toBe('L');
      expect(result.acceptNumber).toBe(1);
      expect(result.rejectNumber).toBe(2);
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
