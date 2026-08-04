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
 * `source` names the published data each number was checked against and states how it agreed.
 * Where a grade sits inside a published spread rather than on a single citation, the entry
 * says so and names the ends of the spread: such a value is pinned as-is, because moving a
 * defensible figure to another defensible figure is churn, not a correction.
 *
 * That last rule has one limit worth stating, because it decided a change here. When siblings
 * in the same family are taken from one tabulation and a third is not, the odd one out is an
 * inconsistency rather than an alternative reading — the copper alloys are all CDA figures,
 * so the one that was not got moved onto CDA with the others. Each copper entry therefore
 * carries the CDA value in ksi, which is the form that source publishes, so a future drift
 * away from it is visible in the golden block itself.
 */
const YOUNGS_MODULUS_GOLDEN: {
  category: 'steel' | 'stainless' | 'aluminum' | 'copper' | 'titanium';
  grade: string;
  gpa: number;
  source: string;
}[] = [
  // Carbon and alloy steels. Modulus is essentially composition-independent across this family,
  // so one figure covers all four rather than each carrying its own citation; the equivalents
  // tabulate together at 205 GPa (29.7e6 psi).
  { category: 'steel', grade: 'SS400', gpa: 205, source: 'carbon steel, within the published 190-215 GPa band; 205 is the conventional figure' },
  { category: 'steel', grade: 'S45C', gpa: 205, source: 'AISI 1045 equivalent, published 205-206 GPa' },
  { category: 'steel', grade: 'SCM440', gpa: 205, source: 'AISI 4140 equivalent, published 205 GPa (29.7e6 psi)' },
  { category: 'steel', grade: 'SK5', gpa: 205, source: 'carbon tool steel; modulus is composition-independent within the family' },

  // Austenitic stainless is distinctly lower than carbon steel; ferritic sits near it.
  { category: 'stainless', grade: 'SUS304', gpa: 193, source: 'AISI 304 equivalent, published 193 GPa (28e6 psi)' },
  { category: 'stainless', grade: 'SUS316', gpa: 193, source: 'AISI 316 equivalent, published 193 GPa (28e6 psi)' },
  { category: 'stainless', grade: 'SUS430', gpa: 200, source: 'AISI 430 equivalent, ferritic, published 200 GPa' },

  // Aluminium: tables that round to two digits give 69/70/72; the stored values carry the digit
  // the alloy datasheets publish.
  { category: 'aluminum', grade: 'A6061-T6', gpa: 68.9, source: 'alloy datasheet value 68.9 GPa (10.0e6 psi)' },
  { category: 'aluminum', grade: 'A5052-H32', gpa: 70.3, source: 'alloy datasheet value 70.3 GPa (10.2e6 psi)' },
  { category: 'aluminum', grade: 'A7075-T6', gpa: 71.7, source: 'alloy datasheet value 71.7 GPa (10.4e6 psi)' },

  // Copper alloys — all three from the CDA alloy tables, which publish modulus in ksi. Storing
  // the ksi figure alongside keeps the three comparable: they agreed at 16000 ksi twice and
  // disagreed once, which is what identified C1100 as the outlier rather than an alternative.
  { category: 'copper', grade: 'C1100', gpa: 117, source: 'CDA C11000, 17000 ksi = 117.2 GPa, rounded as its siblings are' },
  { category: 'copper', grade: 'C2600', gpa: 110, source: 'CDA C26000 cartridge brass, 16000 ksi = 110.3 GPa' },
  { category: 'copper', grade: 'C5191', gpa: 110, source: 'CDA C51900 phosphor bronze, 16000 ksi = 110.3 GPa' },

  // Titanium.
  { category: 'titanium', grade: 'Ti-6Al-4V', gpa: 113.8, source: 'annealed Ti-6Al-4V datasheet value 113.8 GPa (16.5e6 psi)' },
  { category: 'titanium', grade: 'CP-Ti Grade2', gpa: 105, source: 'published spread 102.7 GPa (14.9e3 ksi, mill datasheet) to 105 GPa; pinned at the upper, commonly tabulated figure' },
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

  it('keeps the copper family on the ksi figures its tables publish', () => {
    // The per-grade equality checks above cannot see this: each copper value was defensible on
    // its own, and only comparing the three against one tabulation showed that two followed it
    // and one did not. Converting from the published unit rather than restating the GPa figure
    // means a future edit has to disagree with the source, not merely with a previous edit.
    const KSI_TO_GPA = 6.894757 / 1000;
    const CDA_MODULUS_KSI: Record<string, number> = { C1100: 17000, C2600: 16000, C5191: 16000 };

    for (const [grade, ksi] of Object.entries(CDA_MODULUS_KSI)) {
      const modulus = material({ category: 'copper', grade })!.youngsModulus;

      expect(modulus).toBe(Math.round(ksi * KSI_TO_GPA));
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

/**
 * Golden values for Poisson's ratio (v), and the one grade that deliberately has none.
 *
 * This block exists for a different reason than the modulus block above it. A modulus is
 * tabulated per grade and can be checked against one citation; v is not. Every source that
 * covers more than a single alloy publishes it by family, so what has to be pinned here is
 * not only the number but the decision behind it: which family figure was taken, how wide
 * the published spread was, and — for the grade left empty — why no figure was chosen.
 *
 * `unresolved` is the part that earns its keep. Without it, a later edit could quietly fill
 * CP-Ti Grade 2 with either of its two disagreeing sources and every test would still pass;
 * with it, the absence is asserted, so filling the gap has to be an argued change.
 */
const POISSONS_RATIO_GOLDEN: {
  category: 'steel' | 'stainless' | 'aluminum' | 'copper' | 'titanium';
  grade: string;
  ratio: number;
  source: string;
}[] = [
  // Steels. Tabulations give the family 0.27-0.30 and put the two grades that are cited
  // individually (AISI 1045, 4140 equivalents) at 0.29, so one figure covers the family.
  { category: 'steel', grade: 'SS400', ratio: 0.29, source: 'carbon steel family 0.27-0.30; 0.29 is the conventional figure' },
  { category: 'steel', grade: 'S45C', ratio: 0.29, source: 'AISI 1045 equivalent, published 0.29' },
  { category: 'steel', grade: 'SCM440', ratio: 0.29, source: 'AISI 4140 equivalent, published 0.29' },
  { category: 'steel', grade: 'SK5', ratio: 0.29, source: 'carbon tool steel; v is composition-independent within the family' },

  // Stainless. The published spread is wider than for carbon steel (0.265-0.31 across
  // sources, individual citations at 0.28 and 0.29) and does not separate austenitic from
  // ferritic by more than that spread, so all three carry the conventional 0.29.
  { category: 'stainless', grade: 'SUS304', ratio: 0.29, source: 'AISI 304 equivalent; sources span 0.28-0.30, 0.29 conventional' },
  { category: 'stainless', grade: 'SUS316', ratio: 0.29, source: 'AISI 316 equivalent; sources span 0.28-0.31, 0.29 conventional' },
  { category: 'stainless', grade: 'SUS430', ratio: 0.29, source: 'AISI 430 equivalent, ferritic; within the same 0.27-0.30 band' },

  // Aluminium is the tightest family in the table: 0.330-0.334 across wrought alloys, which
  // is narrower than the two decimals stored here, so one figure is not a compromise.
  { category: 'aluminum', grade: 'A6061-T6', ratio: 0.33, source: 'wrought aluminium 0.330-0.334' },
  { category: 'aluminum', grade: 'A5052-H32', ratio: 0.33, source: 'wrought aluminium 0.330-0.334' },
  { category: 'aluminum', grade: 'A7075-T6', ratio: 0.33, source: 'wrought aluminium 0.330-0.334' },

  // Copper alloys keep v on the same source as their modulus: CDA publishes E and G in ksi,
  // and v = E/(2G) - 1 follows from the pair. The check below recomputes it from those ksi
  // figures rather than restating 0.33 here.
  { category: 'copper', grade: 'C1100', ratio: 0.33, source: 'CDA C11000 E/G 17000/6400 ksi -> 0.328' },
  { category: 'copper', grade: 'C2600', ratio: 0.33, source: 'CDA C26000 E/G 16000/6000 ksi -> 0.333, matching 0.331 tabulated for 70-30 brass' },
  { category: 'copper', grade: 'C5191', ratio: 0.33, source: 'CDA C51900 E/G 16000/6000 ksi -> 0.333' },

  // Titanium. Sources put Ti-6Al-4V at 0.33 (handbook) and 0.342 (alloy datasheet); 0.34 is
  // the two-decimal figure inside that spread and inside the family band 0.32-0.34.
  { category: 'titanium', grade: 'Ti-6Al-4V', ratio: 0.34, source: 'handbook 0.33 / datasheet 0.342, family band 0.32-0.34' },
];

/**
 * Grades that carry no ratio, and the reason. Listed rather than omitted: a grade missing
 * from both lists is an undecided grade, and the coverage test below fails on it.
 */
const POISSONS_RATIO_UNRESOLVED: { category: 'titanium'; grade: string; reason: string }[] = [
  {
    category: 'titanium',
    grade: 'CP-Ti Grade2',
    reason:
      'sources give 0.34 and 0.37 — a 9% disagreement, not a last-digit one — and this is the ' +
      'only commercially pure grade here, so no sibling settles it',
  },
];

describe("Poisson's ratio golden values", () => {
  it.each(POISSONS_RATIO_GOLDEN)('$category/$grade is $ratio — $source', ({ category, grade, ratio }) => {
    const result = material({ category, grade });

    expect(result).not.toBeNull();
    expect(result!.poissonsRatio).toBe(ratio);
  });

  it.each(POISSONS_RATIO_UNRESOLVED)('$category/$grade carries no ratio — $reason', ({ category, grade }) => {
    const result = material({ category, grade });

    expect(result).not.toBeNull();
    expect(result!.poissonsRatio).toBeUndefined();
    expect('poissonsRatio' in result!).toBe(false);
  });

  it('accounts for every grade the table exposes, as a value or as a stated gap', () => {
    const decided = new Set([
      ...POISSONS_RATIO_GOLDEN.map((g) => `${g.category}/${g.grade}`),
      ...POISSONS_RATIO_UNRESOLVED.map((g) => `${g.category}/${g.grade}`),
    ]);

    for (const category of getCategories()) {
      for (const grade of getGrades(category)) {
        expect(decided).toContain(`${category}/${grade}`);
      }
    }
  });

  it('keeps the copper family on the CDA pair its tables publish', () => {
    // Same reasoning as the modulus check: deriving from the published ksi rather than
    // restating the stored figure means a future edit has to disagree with the source.
    const CDA_ELASTIC_KSI: Record<string, { e: number; g: number }> = {
      C1100: { e: 17000, g: 6400 },
      C2600: { e: 16000, g: 6000 },
      C5191: { e: 16000, g: 6000 },
    };

    for (const [grade, { e, g }] of Object.entries(CDA_ELASTIC_KSI)) {
      const derived = e / (2 * g) - 1;
      const stored = material({ category: 'copper', grade })!.poissonsRatio;

      expect(stored).toBe(Number(derived.toFixed(2)));
    }
  });

  it('stays inside the isotropic limit, so a slipped decimal cannot pass', () => {
    // v >= 0.5 is incompressible and v <= 0 does not occur in these metals, so this catches
    // the class of typo that a per-grade equality check cannot: one entered as 3.3 or 0.033
    // would still satisfy its own assertion if that assertion were edited alongside it.
    for (const { category, grade } of POISSONS_RATIO_GOLDEN) {
      const ratio = material({ category, grade })!.poissonsRatio!;

      expect(ratio).toBeGreaterThan(0.2);
      expect(ratio).toBeLessThan(0.5);
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
