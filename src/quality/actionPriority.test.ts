import { describe, it, expect } from 'vitest';
import {
  actionPriority,
  AP_TABLE,
  AP_SEVERITY_BANDS,
  AP_OCCURRENCE_BANDS,
  AP_DETECTION_BANDS,
} from './actionPriority.js';

describe('actionPriority', () => {
  describe('basic AP lookup', () => {
    it('should return H for S=10, O=10, D=10', () => {
      const result = actionPriority({ severity: 10, occurrence: 10, detection: 10 });
      expect(result.actionPriority).toBe('H');
      expect(result.rpn).toBe(1000);
    });

    it('should return L for S=1, O=1, D=1', () => {
      const result = actionPriority({ severity: 1, occurrence: 1, detection: 1 });
      expect(result.actionPriority).toBe('L');
      expect(result.rpn).toBe(1);
    });
  });

  describe('severity group boundaries', () => {
    it('S=1 → sGroup 0', () => {
      expect(actionPriority({ severity: 1, occurrence: 1, detection: 1 }).severityGroup).toBe(0);
    });

    it('S=2 → sGroup 1', () => {
      expect(actionPriority({ severity: 2, occurrence: 1, detection: 1 }).severityGroup).toBe(1);
    });

    it('S=3 → sGroup 1', () => {
      expect(actionPriority({ severity: 3, occurrence: 1, detection: 1 }).severityGroup).toBe(1);
    });

    it('S=4 → sGroup 2', () => {
      expect(actionPriority({ severity: 4, occurrence: 1, detection: 1 }).severityGroup).toBe(2);
    });

    it('S=7 → sGroup 3', () => {
      expect(actionPriority({ severity: 7, occurrence: 1, detection: 1 }).severityGroup).toBe(3);
    });

    it('S=9 → sGroup 4', () => {
      expect(actionPriority({ severity: 9, occurrence: 1, detection: 1 }).severityGroup).toBe(4);
    });
  });

  describe('occurrence group boundaries (AIAG-VDA: 1 / 2-3 / 4-5 / 6-7 / 8-10)', () => {
    it('O=1 → oGroup 0', () => {
      expect(actionPriority({ severity: 5, occurrence: 1, detection: 5 }).occurrenceGroup).toBe(0);
    });

    it('O=3 → oGroup 1', () => {
      expect(actionPriority({ severity: 5, occurrence: 3, detection: 5 }).occurrenceGroup).toBe(1);
    });

    it('O=4 → oGroup 2', () => {
      expect(actionPriority({ severity: 5, occurrence: 4, detection: 5 }).occurrenceGroup).toBe(2);
    });

    it('O=5 → oGroup 2 / O=6 → oGroup 3 (handbook 4-5 | 6-7 split)', () => {
      expect(actionPriority({ severity: 5, occurrence: 5, detection: 5 }).occurrenceGroup).toBe(2);
      expect(actionPriority({ severity: 5, occurrence: 6, detection: 5 }).occurrenceGroup).toBe(3);
    });

    it('O=7 → oGroup 3 / O=8 → oGroup 4 (handbook 6-7 | 8-10 split)', () => {
      expect(actionPriority({ severity: 5, occurrence: 7, detection: 5 }).occurrenceGroup).toBe(3);
      expect(actionPriority({ severity: 5, occurrence: 8, detection: 5 }).occurrenceGroup).toBe(4);
    });

    it('O=5/6 boundary changes the verdict: S=5, D=5 → L vs M', () => {
      expect(actionPriority({ severity: 5, occurrence: 5, detection: 5 }).actionPriority).toBe('L');
      expect(actionPriority({ severity: 5, occurrence: 6, detection: 5 }).actionPriority).toBe('M');
    });

    it('O=7/8 boundary changes the verdict: S=5, D=1 → L vs M', () => {
      expect(actionPriority({ severity: 5, occurrence: 7, detection: 1 }).actionPriority).toBe('L');
      expect(actionPriority({ severity: 5, occurrence: 8, detection: 1 }).actionPriority).toBe('M');
    });
  });

  describe('detection group boundaries (AIAG-VDA: 1 / 2-4 / 5-6 / 7-10, four bands)', () => {
    it('D=1 → dGroup 0', () => {
      expect(actionPriority({ severity: 1, occurrence: 1, detection: 1 }).detectionGroup).toBe(0);
    });

    it('D=2 → dGroup 1', () => {
      expect(actionPriority({ severity: 1, occurrence: 1, detection: 2 }).detectionGroup).toBe(1);
    });

    it('D=4 → dGroup 1', () => {
      expect(actionPriority({ severity: 1, occurrence: 1, detection: 4 }).detectionGroup).toBe(1);
    });

    it('D=5 → dGroup 2', () => {
      expect(actionPriority({ severity: 1, occurrence: 1, detection: 5 }).detectionGroup).toBe(2);
    });

    it('D=6 → dGroup 2 / D=7 → dGroup 3 (handbook 5-6 | 7-10 split)', () => {
      expect(actionPriority({ severity: 1, occurrence: 1, detection: 6 }).detectionGroup).toBe(2);
      expect(actionPriority({ severity: 1, occurrence: 1, detection: 7 }).detectionGroup).toBe(3);
    });

    it('D=7 through D=10 share one group (no 7-8 | 9-10 split)', () => {
      const groups = [7, 8, 9, 10].map(
        (d) => actionPriority({ severity: 9, occurrence: 2, detection: d }).detectionGroup,
      );
      expect(groups).toEqual([3, 3, 3, 3]);
    });

    it('D=6/7 boundary changes the verdict: S=5, O=5 → L vs M', () => {
      expect(actionPriority({ severity: 5, occurrence: 5, detection: 6 }).actionPriority).toBe('L');
      expect(actionPriority({ severity: 5, occurrence: 5, detection: 7 }).actionPriority).toBe('M');
    });

    it('D=9 and D=10 give the same verdict as D=7 (single 7-10 band)', () => {
      const aps = [7, 9, 10].map(
        (d) => actionPriority({ severity: 9, occurrence: 2, detection: d }).actionPriority,
      );
      expect(aps).toEqual(['H', 'H', 'H']);
    });
  });

  describe('handbook invariants', () => {
    it('S=1 → L for every O/D combination', () => {
      for (let o = 1; o <= 10; o++) {
        for (let d = 1; d <= 10; d++) {
          expect(actionPriority({ severity: 1, occurrence: o, detection: d }).actionPriority).toBe('L');
        }
      }
    });

    it('S=1, O=10, D=10 → L (upstream-006 tripwire cell)', () => {
      expect(actionPriority({ severity: 1, occurrence: 10, detection: 10 }).actionPriority).toBe('L');
    });

    it('O=1 → L for every S/D combination', () => {
      for (let s = 1; s <= 10; s++) {
        for (let d = 1; d <= 10; d++) {
          expect(actionPriority({ severity: s, occurrence: 1, detection: d }).actionPriority).toBe('L');
        }
      }
    });
  });

  describe('AP table golden cells (AIAG-VDA 2019, cross-checked vs Relyence reproduction)', () => {
    // S=9-10 section
    it('S=9, O=3, D=4 → L (low occurrence, high detection ability)', () => {
      expect(actionPriority({ severity: 9, occurrence: 3, detection: 4 }).actionPriority).toBe('L');
    });

    it('S=9, O=3, D=5 → M', () => {
      expect(actionPriority({ severity: 9, occurrence: 3, detection: 5 }).actionPriority).toBe('M');
    });

    it('S=9, O=2, D=7 → H', () => {
      expect(actionPriority({ severity: 9, occurrence: 2, detection: 7 }).actionPriority).toBe('H');
    });

    it('S=10, O=4, D=1 → M', () => {
      expect(actionPriority({ severity: 10, occurrence: 4, detection: 1 }).actionPriority).toBe('M');
    });

    it('S=10, O=5, D=2 → H', () => {
      expect(actionPriority({ severity: 10, occurrence: 5, detection: 2 }).actionPriority).toBe('H');
    });

    it('S=9, O=6, D=1 → H', () => {
      expect(actionPriority({ severity: 9, occurrence: 6, detection: 1 }).actionPriority).toBe('H');
    });

    // S=7-8 section
    it('S=7, O=2, D=1 → L', () => {
      expect(actionPriority({ severity: 7, occurrence: 2, detection: 1 }).actionPriority).toBe('L');
    });

    it('S=8, O=3, D=10 → M', () => {
      expect(actionPriority({ severity: 8, occurrence: 3, detection: 10 }).actionPriority).toBe('M');
    });

    it('S=8, O=4, D=1 → M', () => {
      expect(actionPriority({ severity: 8, occurrence: 4, detection: 1 }).actionPriority).toBe('M');
    });

    it('S=7, O=5, D=7 → H', () => {
      expect(actionPriority({ severity: 7, occurrence: 5, detection: 7 }).actionPriority).toBe('H');
    });

    it('S=8, O=7, D=1 → M', () => {
      expect(actionPriority({ severity: 8, occurrence: 7, detection: 1 }).actionPriority).toBe('M');
    });

    it('S=8, O=6, D=3 → H', () => {
      expect(actionPriority({ severity: 8, occurrence: 6, detection: 3 }).actionPriority).toBe('H');
    });

    // S=4-6 section
    it('S=4, O=8, D=1 → M', () => {
      expect(actionPriority({ severity: 4, occurrence: 8, detection: 1 }).actionPriority).toBe('M');
    });

    it('S=6, O=10, D=5 → H', () => {
      expect(actionPriority({ severity: 6, occurrence: 10, detection: 5 }).actionPriority).toBe('H');
    });

    it('S=5, O=6, D=2 → M', () => {
      expect(actionPriority({ severity: 5, occurrence: 6, detection: 2 }).actionPriority).toBe('M');
    });

    it('S=4, O=5, D=7 → M', () => {
      expect(actionPriority({ severity: 4, occurrence: 5, detection: 7 }).actionPriority).toBe('M');
    });

    it('S=6, O=4, D=6 → L', () => {
      expect(actionPriority({ severity: 6, occurrence: 4, detection: 6 }).actionPriority).toBe('L');
    });

    // S=2-3 section
    it('S=2, O=8, D=5 → M', () => {
      expect(actionPriority({ severity: 2, occurrence: 8, detection: 5 }).actionPriority).toBe('M');
    });

    it('S=3, O=10, D=10 → M', () => {
      expect(actionPriority({ severity: 3, occurrence: 10, detection: 10 }).actionPriority).toBe('M');
    });

    it('S=2, O=10, D=4 → L', () => {
      expect(actionPriority({ severity: 2, occurrence: 10, detection: 4 }).actionPriority).toBe('L');
    });

    it('S=3, O=7, D=10 → L', () => {
      expect(actionPriority({ severity: 3, occurrence: 7, detection: 10 }).actionPriority).toBe('L');
    });
  });

  describe('exported table and bands', () => {
    it('bands cover 1-10 contiguously without gaps or overlaps', () => {
      for (const bands of [AP_SEVERITY_BANDS, AP_OCCURRENCE_BANDS, AP_DETECTION_BANDS]) {
        expect(bands[0].min).toBe(1);
        expect(bands[bands.length - 1].max).toBe(10);
        for (let i = 1; i < bands.length; i++) {
          expect(bands[i].min).toBe(bands[i - 1].max + 1);
        }
      }
    });

    it('AP_TABLE dimensions match the band counts (5 × 5 × 4)', () => {
      expect(AP_TABLE).toHaveLength(AP_SEVERITY_BANDS.length);
      for (const oRows of AP_TABLE) {
        expect(oRows).toHaveLength(AP_OCCURRENCE_BANDS.length);
        for (const dCells of oRows) {
          expect(dCells).toHaveLength(AP_DETECTION_BANDS.length);
        }
      }
    });

    it('actionPriority() agrees with AP_TABLE + bands for all 1000 S/O/D combinations', () => {
      const groupOf = (value: number, bands: typeof AP_SEVERITY_BANDS): number =>
        bands.findIndex((b) => value >= b.min && value <= b.max);
      for (let s = 1; s <= 10; s++) {
        for (let o = 1; o <= 10; o++) {
          for (let d = 1; d <= 10; d++) {
            const result = actionPriority({ severity: s, occurrence: o, detection: d });
            const expected =
              AP_TABLE[groupOf(s, AP_SEVERITY_BANDS)][groupOf(o, AP_OCCURRENCE_BANDS)][
                groupOf(d, AP_DETECTION_BANDS)
              ];
            expect(result.actionPriority).toBe(expected);
          }
        }
      }
    });
  });

  describe('RPN calculation', () => {
    it('should compute RPN as S × O × D', () => {
      const result = actionPriority({ severity: 7, occurrence: 4, detection: 3 });
      expect(result.rpn).toBe(84);
    });
  });

  describe('validation', () => {
    it('should throw for severity < 1', () => {
      expect(() => actionPriority({ severity: 0, occurrence: 5, detection: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for severity > 10', () => {
      expect(() => actionPriority({ severity: 11, occurrence: 5, detection: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for occurrence < 1', () => {
      expect(() => actionPriority({ severity: 5, occurrence: 0, detection: 5 }))
        .toThrow(RangeError);
    });

    it('should throw for detection > 10', () => {
      expect(() => actionPriority({ severity: 5, occurrence: 5, detection: 11 }))
        .toThrow(RangeError);
    });

    it('should throw for NaN severity', () => {
      expect(() => actionPriority({ severity: NaN, occurrence: 5, detection: 5 }))
        .toThrow(RangeError);
    });
  });

  /**
   * Structural invariants (CLAUDE.md §6(d)).
   *
   * The golden cells above pin values the handbook states. These assert relationships the
   * table must satisfy *as a whole*, which is what catches the transcription slips §6 names:
   * a band copied from a neighbouring axis, or an off-by-one from an omitted column, moves
   * many cells at once and almost always breaks the ordering.
   *
   * Measured: of the 200 single-cell mutations possible over the 100 cells, monotonicity
   * alone rejects 170 (85%). The remaining 30 sit where a neighbour already shares the new
   * value; those are the ones the golden cells have to carry.
   */
  describe('structural invariants', () => {
    const RANK: Record<string, number> = { L: 0, M: 1, H: 2 };

    it('never lowers the priority when a rating rises', () => {
      for (let s = 0; s < AP_TABLE.length; s++) {
        for (let o = 0; o < AP_TABLE[s].length; o++) {
          for (let d = 0; d < AP_TABLE[s][o].length; d++) {
            const here = RANK[AP_TABLE[s][o][d]];
            const where = `[s${s}][o${o}][d${d}]`;
            if (s + 1 < AP_TABLE.length) {
              expect(RANK[AP_TABLE[s + 1][o][d]], `severity ${where}`).toBeGreaterThanOrEqual(here);
            }
            if (o + 1 < AP_TABLE[s].length) {
              expect(RANK[AP_TABLE[s][o + 1][d]], `occurrence ${where}`).toBeGreaterThanOrEqual(here);
            }
            if (d + 1 < AP_TABLE[s][o].length) {
              expect(RANK[AP_TABLE[s][o][d + 1]], `detection ${where}`).toBeGreaterThanOrEqual(here);
            }
          }
        }
      }
    });

    it('contains only the three priority levels', () => {
      for (const cell of AP_TABLE.flat(2)) {
        expect(['L', 'M', 'H']).toContain(cell);
      }
    });

    it('lets detection change the outcome, so a dropped column cannot pass unnoticed', () => {
      const varies = AP_TABLE.some((oRows) => oRows.some((dCells) => new Set(dCells).size > 1));
      expect(varies).toBe(true);
    });

    it('uses every priority level, so a collapsed table cannot pass unnoticed', () => {
      expect(new Set(AP_TABLE.flat(2))).toEqual(new Set(['L', 'M', 'H']));
    });
  });
});
