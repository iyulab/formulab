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
    it('should throw for invalid category', () => {
      expect(() => material({ category: 'invalid' as any, grade: 'SS400' })).toThrow(RangeError);
    });

    it('should throw for invalid grade', () => {
      expect(() => material({ category: 'steel', grade: 'INVALID' })).toThrow(RangeError);
    });
  });
});

/**
 * Golden values for Young's modulus (GPa), one per grade.
 *
 * These are table transcriptions, not computed results, so nothing else in the suite can
 * catch a typo in them — a wrong modulus silently propagates into every consumer that sizes
 * a beam, a column or a press fit. This block pins all fifteen so a change has to be
 * deliberate.
 *
 * `source` records where each number was checked against published data, and how exactly it
 * agreed. Two entries sit inside the published spread rather than on a single citation and
 * say so; they are pinned as-is because moving a defensible value to another defensible
 * value is churn, not a correction.
 */
const YOUNGS_MODULUS_GOLDEN: {
  category: 'steel' | 'stainless' | 'aluminum' | 'copper' | 'titanium';
  grade: string;
  gpa: number;
  source: string;
}[] = [
  // Carbon and alloy steels: modulus is essentially composition-independent. Published values
  // cluster at 190-215 GPa (ASTM A36 ~200, AISI 4340 190-210); 205 is the conventional value.
  { category: 'steel', grade: 'SS400', gpa: 205, source: 'within published 190-215 GPa band for carbon/alloy steel' },
  { category: 'steel', grade: 'S45C', gpa: 205, source: 'as SS400' },
  { category: 'steel', grade: 'SCM440', gpa: 205, source: 'as SS400' },
  { category: 'steel', grade: 'SK5', gpa: 205, source: 'as SS400' },

  // Austenitic stainless is distinctly lower than carbon steel; ferritic sits near it.
  { category: 'stainless', grade: 'SUS304', gpa: 193, source: 'standard austenitic 304/316 value (193 GPa / 28e6 psi)' },
  { category: 'stainless', grade: 'SUS316', gpa: 193, source: 'matches published 316 value exactly' },
  { category: 'stainless', grade: 'SUS430', gpa: 200, source: 'ferritic 430, published 200 GPa' },

  // Aluminium: published tables round to 69/70/72; the stored values carry the extra digit.
  { category: 'aluminum', grade: 'A6061-T6', gpa: 68.9, source: 'agrees with published 69 GPa (10e6 psi)' },
  { category: 'aluminum', grade: 'A5052-H32', gpa: 70.3, source: 'agrees with published 70 GPa' },
  { category: 'aluminum', grade: 'A7075-T6', gpa: 71.7, source: 'agrees with published 72 GPa' },

  // Copper alloys.
  { category: 'copper', grade: 'C1100', gpa: 115, source: 'published range 115-117 GPa (16.7-17e6 psi); pinned at the lower, widely tabulated figure' },
  { category: 'copper', grade: 'C2600', gpa: 110, source: 'matches published cartridge brass value exactly' },
  { category: 'copper', grade: 'C5191', gpa: 110, source: 'phosphor bronze, published ~110 GPa (16e6 psi)' },

  // Titanium.
  { category: 'titanium', grade: 'Ti-6Al-4V', gpa: 113.8, source: 'matches published annealed Ti-6Al-4V value exactly' },
  { category: 'titanium', grade: 'CP-Ti Grade2', gpa: 105, source: 'published range 102.7-105 GPa for grade 2; pinned at the upper, commonly quoted figure' },
];

describe("Young's modulus golden values", () => {
  it.each(YOUNGS_MODULUS_GOLDEN)('$category/$grade is $gpa GPa — $source', ({ category, grade, gpa }) => {
    const result = material({ category, grade });

    expect(result).not.toBeNull();
    expect(result!.youngsModulus).toBe(gpa);
  });

  it('covers every grade the table exposes', () => {
    const covered = new Set(YOUNGS_MODULUS_GOLDEN.map((g) => `${g.category}/${g.grade}`));

    for (const category of getCategories()) {
      for (const grade of getGrades(category)) {
        expect(covered).toContain(`${category}/${grade}`);
      }
    }
  });

  it('reports modulus in GPa, so every value stays within an order of magnitude of steel', () => {
    // Guards the unit slip that a per-grade equality check cannot see: if one entry were
    // entered in MPa or psi it would still pass its own assertion.
    for (const { category, grade } of YOUNGS_MODULUS_GOLDEN) {
      const modulus = material({ category, grade })!.youngsModulus;

      expect(modulus).toBeGreaterThan(50);
      expect(modulus).toBeLessThan(250);
    }
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
