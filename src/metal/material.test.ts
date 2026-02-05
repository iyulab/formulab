import { describe, it, expect } from 'vitest';
import { material, getCategories, getGrades } from './material.js';

describe('material', () => {
  describe('steel grades', () => {
    it('should return properties for SS400', () => {
      const result = material({ category: 'steel', grade: 'SS400' });

      expect(result).not.toBeNull();
      expect(result!.density).toBe(7.85);
      expect(result!.tensileStrength).toBe(400);
      expect(result!.yieldStrength).toBe(245);
    });

    it('should return properties for S45C', () => {
      const result = material({ category: 'steel', grade: 'S45C' });

      expect(result).not.toBeNull();
      expect(result!.tensileStrength).toBe(570);
    });

    it('should return properties for SCM440', () => {
      const result = material({ category: 'steel', grade: 'SCM440' });

      expect(result).not.toBeNull();
      expect(result!.tensileStrength).toBe(980);
      expect(result!.yieldStrength).toBe(830);
    });
  });

  describe('stainless grades', () => {
    it('should return properties for SUS304', () => {
      const result = material({ category: 'stainless', grade: 'SUS304' });

      expect(result).not.toBeNull();
      expect(result!.density).toBe(7.93);
      expect(result!.elongation).toBe(40);
    });

    it('should return properties for SUS316', () => {
      const result = material({ category: 'stainless', grade: 'SUS316' });

      expect(result).not.toBeNull();
      expect(result!.density).toBe(7.98);
    });
  });

  describe('aluminum grades', () => {
    it('should return properties for A6061-T6', () => {
      const result = material({ category: 'aluminum', grade: 'A6061-T6' });

      expect(result).not.toBeNull();
      expect(result!.density).toBe(2.70);
      expect(result!.thermalConductivity).toBe(167);
    });

    it('should return properties for A7075-T6', () => {
      const result = material({ category: 'aluminum', grade: 'A7075-T6' });

      expect(result).not.toBeNull();
      expect(result!.tensileStrength).toBe(572);
    });
  });

  describe('copper grades', () => {
    it('should return properties for C1100', () => {
      const result = material({ category: 'copper', grade: 'C1100' });

      expect(result).not.toBeNull();
      expect(result!.density).toBe(8.94);
      expect(result!.thermalConductivity).toBe(391);
    });
  });

  describe('titanium grades', () => {
    it('should return properties for Ti-6Al-4V', () => {
      const result = material({ category: 'titanium', grade: 'Ti-6Al-4V' });

      expect(result).not.toBeNull();
      expect(result!.density).toBe(4.43);
      expect(result!.tensileStrength).toBe(950);
    });
  });

  describe('edge cases', () => {
    it('should return null for invalid category', () => {
      const result = material({ category: 'invalid' as any, grade: 'SS400' });

      expect(result).toBeNull();
    });

    it('should return null for invalid grade', () => {
      const result = material({ category: 'steel', grade: 'INVALID' });

      expect(result).toBeNull();
    });
  });
});

describe('getCategories', () => {
  it('should return all material categories', () => {
    const categories = getCategories();

    expect(categories).toContain('steel');
    expect(categories).toContain('stainless');
    expect(categories).toContain('aluminum');
    expect(categories).toContain('copper');
    expect(categories).toContain('titanium');
  });
});

describe('getGrades', () => {
  it('should return steel grades', () => {
    const grades = getGrades('steel');

    expect(grades).toContain('SS400');
    expect(grades).toContain('S45C');
    expect(grades).toContain('SCM440');
  });

  it('should return aluminum grades', () => {
    const grades = getGrades('aluminum');

    expect(grades).toContain('A6061-T6');
    expect(grades).toContain('A7075-T6');
  });

  it('should return empty array for invalid category', () => {
    const grades = getGrades('invalid' as any);

    expect(grades).toEqual([]);
  });
});
