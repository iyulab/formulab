import { describe, it, expect } from 'vitest';
import {
  minBendRadiusAluminum,
  ALUMINUM_BEND_MAX_THICKNESS,
  ALUMINUM_BEND_TEMPERS,
  DEFAULT_ALUMINUM_BEND_TEMPER,
} from './minBendRadiusAluminum.js';
import { bendAllowance } from './bendAllowance.js';
import type { AluminumBendAlloy, AluminumBendTemper } from './types.js';

// Thickness columns of the Aluminum Association table, in mm (1/64 … 1/2 in at 0.1 mm).
const COLUMN_MM = [0.4, 0.8, 1.6, 3.2, 4.8, 6.4, 9.5, 12.7];

// The table's cells, typed independently of the implementation: multiples of thickness.
const CELLS: [AluminumBendAlloy, AluminumBendTemper, number[]][] = [
  ['6061', 'O', [0, 0, 0, 1, 1, 1, 1.5, 2]],
  ['6061', 'T4', [0, 0, 1, 1.5, 2.5, 3, 3.5, 4]],
  ['6061', 'T6', [1, 1, 1.5, 2.5, 3, 3.5, 4.5, 5]],
  ['5052', 'O', [0, 0, 0, 0, 0.5, 1, 1, 1.5]],
  ['5052', 'H32', [0, 0, 1, 1.5, 1.5, 1.5, 1.5, 2]],
  ['5052', 'H34', [0, 1, 1.5, 2, 2, 2.5, 2.5, 3]],
];

describe('minBendRadiusAluminum', () => {
  describe('table cells (Aluminum Association, 90° cold forming of sheet and plate)', () => {
    for (const [alloy, temper, row] of CELLS) {
      it(`${alloy}-${temper}: every column reads its own multiple`, () => {
        row.forEach((multiple, i) => {
          const result = minBendRadiusAluminum({ alloy, temper, thickness: COLUMN_MM[i] });
          expect(result?.multiplier).toBe(multiple);
          expect(result?.thicknessColumnUpper).toBe(COLUMN_MM[i]);
          expect(result?.minBendRadius).toBeCloseTo(multiple * COLUMN_MM[i], 6);
        });
      });
    }
  });

  describe('agrees with the independent published points', () => {
    it('6061-T6 at 3/16 in is 3T (Aluminum Design Manual, as quoted)', () => {
      expect(minBendRadiusAluminum({ alloy: '6061', temper: 'T6', thickness: 4.7625 })?.multiplier).toBe(3);
    });

    it('6061-T6 at .064 in sits inside the 1–2T a supplier datasheet gives', () => {
      const r = minBendRadiusAluminum({ alloy: '6061', temper: 'T6', thickness: 1.6256 });
      // .064 in is just past the 1/16 column, so the next column (2.5T) is read — conservative.
      expect(r?.multiplier).toBe(2.5);
      expect(minBendRadiusAluminum({ alloy: '6061', temper: 'T6', thickness: 1.6 })?.multiplier).toBe(1.5);
    });

    it('6061-T4 at 1/16 in is 1T, 6061-O needs no radius there', () => {
      expect(minBendRadiusAluminum({ alloy: '6061', temper: 'T4', thickness: 1.6 })?.multiplier).toBe(1);
      expect(minBendRadiusAluminum({ alloy: '6061', temper: 'O', thickness: 1.6 })?.minBendRadius).toBe(0);
    });
  });

  describe('column boundaries', () => {
    it('reads the column at its upper edge, the next one a hair above', () => {
      const at = minBendRadiusAluminum({ alloy: '6061', temper: 'T6', thickness: 3.2 });
      const above = minBendRadiusAluminum({ alloy: '6061', temper: 'T6', thickness: 3.21 });
      expect(at?.multiplier).toBe(2.5);
      expect(above?.multiplier).toBe(3);
      expect(above?.thicknessColumnUpper).toBe(4.8);
    });

    it('serves everything below the thinnest column from that column', () => {
      expect(minBendRadiusAluminum({ alloy: '6061', temper: 'T6', thickness: 0.1 })?.multiplier).toBe(1);
    });

    it('returns null past 12.7 mm instead of extrapolating', () => {
      expect(ALUMINUM_BEND_MAX_THICKNESS).toBe(12.7);
      expect(minBendRadiusAluminum({ alloy: '6061', temper: 'T6', thickness: 12.7 })?.multiplier).toBe(5);
      expect(minBendRadiusAluminum({ alloy: '6061', temper: 'T6', thickness: 12.71 })).toBeNull();
    });
  });

  describe('structural invariants of the table', () => {
    it('never falls as thickness rises, for every row', () => {
      for (const [, , row] of CELLS) {
        for (let i = 1; i < row.length; i++) expect(row[i]).toBeGreaterThanOrEqual(row[i - 1]);
      }
      for (const [alloy, temper] of CELLS) {
        let last = -1;
        for (let t = 0.2; t <= 12.7; t += 0.1) {
          const m = minBendRadiusAluminum({ alloy, temper, thickness: t })!.multiplier;
          expect(m).toBeGreaterThanOrEqual(last);
          last = m;
        }
      }
    });

    it('never falls as the temper gets harder', () => {
      const at = (alloy: AluminumBendAlloy, temper: AluminumBendTemper, thickness: number) =>
        minBendRadiusAluminum({ alloy, temper, thickness })!.multiplier;
      for (const t of COLUMN_MM) {
        expect(at('6061', 'T4', t)).toBeGreaterThanOrEqual(at('6061', 'O', t));
        expect(at('6061', 'T6', t)).toBeGreaterThanOrEqual(at('6061', 'T4', t));
        expect(at('5052', 'H32', t)).toBeGreaterThanOrEqual(at('5052', 'O', t));
        expect(at('5052', 'H34', t)).toBeGreaterThanOrEqual(at('5052', 'H32', t));
      }
    });
  });

  describe('refusals', () => {
    it('refuses a temper the alloy row does not list, naming the temper', () => {
      expect(() => minBendRadiusAluminum({ alloy: '6061', temper: 'H32', thickness: 2 })).toThrow(
        expect.objectContaining({ code: 'unknown_option', parameter: 'temper', got: 'H32' }),
      );
      expect(() => minBendRadiusAluminum({ alloy: '5052', temper: 'T6', thickness: 2 })).toThrow(
        expect.objectContaining({ code: 'unknown_option', parameter: 'temper' }),
      );
    });

    it('refuses an unknown alloy and a non-positive thickness', () => {
      expect(() =>
        minBendRadiusAluminum({ alloy: '7075' as AluminumBendAlloy, temper: 'T6', thickness: 2 }),
      ).toThrow(expect.objectContaining({ code: 'unknown_option', parameter: 'alloy' }));
      expect(() => minBendRadiusAluminum({ alloy: '6061', temper: 'T6', thickness: 0 })).toThrow(
        expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'thickness' }),
      );
    });
  });
});

describe('bendAllowance — aluminium minimum bend radius', () => {
  it('reads 6061 from the table (T6 by default), not a flat 1.5×', () => {
    const r = bendAllowance({ thickness: 3.2, bendAngle: 90, insideRadius: 4, material: 'aluminum6061' });
    // 3.2 mm T6 = 2.5T = 8 mm; the flat 1.5× said 4.8 mm and a 4 mm radius drew no warning.
    expect(r.minBendRadius).toBe(8);
    expect(r.minBendRadiusBasis).toBe('aluminumAssociation');
    expect(r.diagnostics.some((d) => d.code === 'bend_radius_below_minimum')).toBe(true);
  });

  it('takes the temper the caller states', () => {
    const base = { thickness: 3.2, bendAngle: 90, insideRadius: 4, material: 'aluminum6061' } as const;
    expect(bendAllowance({ ...base, temper: 'T4' }).minBendRadius).toBe(4.8);
    expect(bendAllowance({ ...base, temper: 'O' }).minBendRadius).toBe(3.2);
    expect(bendAllowance({ ...base, temper: 'O' }).warnings).toEqual([]);
  });

  it('reads 5052 as H32 by default', () => {
    const r = bendAllowance({ thickness: 3.2, bendAngle: 90, insideRadius: 5, material: 'aluminum5052' });
    expect(r.minBendRadius).toBe(4.8);
    expect(r.minBendRadiusBasis).toBe('aluminumAssociation');
  });

  it('refuses a temper the alloy does not have', () => {
    expect(() =>
      bendAllowance({ thickness: 2, bendAngle: 90, insideRadius: 3, material: 'aluminum6061', temper: 'H34' }),
    ).toThrow(expect.objectContaining({ code: 'unknown_option', parameter: 'temper' }));
  });

  it('falls back to the conventional multiplier past the table', () => {
    const r = bendAllowance({ thickness: 15, bendAngle: 90, insideRadius: 30, material: 'aluminum6061' });
    expect(r.minBendRadius).toBe(22.5);
    expect(r.minBendRadiusBasis).toBe('convention');
  });

  it('ignores temper for a material it does not apply to', () => {
    const r = bendAllowance({ thickness: 2, bendAngle: 90, insideRadius: 3, material: 'stainless304', temper: 'T6' });
    expect(r.minBendRadiusBasis).toBe('convention');
  });
});

describe('aluminium temper lists', () => {
  it('lists exactly the tempers the table rows hold, defaulting inside them', () => {
    expect(ALUMINUM_BEND_TEMPERS['6061']).toEqual(['O', 'T4', 'T6']);
    expect(ALUMINUM_BEND_TEMPERS['5052']).toEqual(['O', 'H32', 'H34']);
    for (const alloy of ['5052', '6061'] as const) {
      expect(ALUMINUM_BEND_TEMPERS[alloy]).toContain(DEFAULT_ALUMINUM_BEND_TEMPER[alloy]);
    }
  });
});
