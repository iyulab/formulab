import { describe, it, expect } from 'vitest';
import { cpkToOccurrence } from './cpkToOccurrence.js';

describe('cpkToOccurrence', () => {
  describe('mapping table', () => {
    it('Cpk=2.5 → O=1', () => {
      const result = cpkToOccurrence({ cpk: 2.5 });
      expect(result.occurrence).toBe(1);
    });

    it('Cpk=2.0 → O=1 (boundary)', () => {
      const result = cpkToOccurrence({ cpk: 2.0 });
      expect(result.occurrence).toBe(1);
    });

    it('Cpk=1.99 → O=2', () => {
      const result = cpkToOccurrence({ cpk: 1.99 });
      expect(result.occurrence).toBe(2);
    });

    it('Cpk=1.67 → O=2 (boundary)', () => {
      const result = cpkToOccurrence({ cpk: 1.67 });
      expect(result.occurrence).toBe(2);
    });

    it('Cpk=1.5 → O=3', () => {
      const result = cpkToOccurrence({ cpk: 1.5 });
      expect(result.occurrence).toBe(3);
    });

    it('Cpk=1.33 → O=3 (boundary)', () => {
      const result = cpkToOccurrence({ cpk: 1.33 });
      expect(result.occurrence).toBe(3);
    });

    it('Cpk=1.0 → O=4 (boundary)', () => {
      const result = cpkToOccurrence({ cpk: 1.0 });
      expect(result.occurrence).toBe(4);
    });

    it('Cpk=0.9 → O=5', () => {
      const result = cpkToOccurrence({ cpk: 0.9 });
      expect(result.occurrence).toBe(5);
    });

    it('Cpk=0.7 → O=6', () => {
      const result = cpkToOccurrence({ cpk: 0.7 });
      expect(result.occurrence).toBe(6);
    });

    it('Cpk=0.55 → O=7', () => {
      const result = cpkToOccurrence({ cpk: 0.55 });
      expect(result.occurrence).toBe(7);
    });

    it('Cpk=0.4 → O=8', () => {
      const result = cpkToOccurrence({ cpk: 0.4 });
      expect(result.occurrence).toBe(8);
    });

    it('Cpk=0.2 → O=9', () => {
      const result = cpkToOccurrence({ cpk: 0.2 });
      expect(result.occurrence).toBe(9);
    });

    it('Cpk=0.1 → O=10', () => {
      const result = cpkToOccurrence({ cpk: 0.1 });
      expect(result.occurrence).toBe(10);
    });

    it('Cpk=0 → O=10', () => {
      const result = cpkToOccurrence({ cpk: 0 });
      expect(result.occurrence).toBe(10);
    });
  });

  describe('output fields', () => {
    it('should return description and cpkRange', () => {
      const result = cpkToOccurrence({ cpk: 1.5 });
      expect(result.description).toBeTruthy();
      expect(result.cpkRange).toBeTruthy();
    });
  });

  describe('validation', () => {
    it('should throw for negative cpk', () => {
      expect(() => cpkToOccurrence({ cpk: -0.5 })).toThrow(RangeError);
    });

    it('should throw for NaN', () => {
      expect(() => cpkToOccurrence({ cpk: NaN })).toThrow(RangeError);
    });

    it('should throw for Infinity', () => {
      expect(() => cpkToOccurrence({ cpk: Infinity })).toThrow(RangeError);
    });
  });
});
