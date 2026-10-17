import { inputRangeError } from '../errors.js';
import { requireFinite, roundTo } from '../utils.js';
import type {
  AluminumBendAlloy,
  AluminumBendTemper,
  MinBendRadiusAluminumInput,
  MinBendRadiusAluminumResult,
} from './types.js';

/**
 * Upper bound (inclusive, mm) of each thickness column, in column order. The table prints
 * 1/64, 1/32, 1/16, 1/8, 3/16, 1/4, 3/8 and 1/2 in; they are kept to 0.1 mm so that the metric
 * nominal sizes of the same gauges (1.6, 3.2, 6.4, 12.7 mm) read their own column instead of
 * stepping to the next one over a hundredth of a millimetre.
 */
const THICKNESS_COLUMN_UPPER = [0.4, 0.8, 1.6, 3.2, 4.8, 6.4, 9.5, 12.7] as const;

/** Largest thickness the table covers, in mm. */
export const ALUMINUM_BEND_MAX_THICKNESS = THICKNESS_COLUMN_UPPER[THICKNESS_COLUMN_UPPER.length - 1];

/**
 * Minimum radius as a multiple of thickness: one row per alloy and temper, one value per
 * thickness column. `0` is the table's own entry for «no minimum» (the sheet bends flat).
 *
 * @reference Aluminum Association, Aluminum Standards and Data — «Recommended Minimum Bend Radii
 *   for 90 Degree Cold Forming of Sheet and Plate» (the table of Aluminum Design Manual Table 3-1),
 *   rows 5052-O / H32 / H34 and 6061-O / T4 / T6 & T651. Transcribed from a cell-complete
 *   reproduction with its footnotes.
 */
const TABLE: Record<AluminumBendAlloy, Partial<Record<AluminumBendTemper, readonly number[]>>> = {
  '5052': {
    O: [0, 0, 0, 0, 0.5, 1, 1, 1.5],
    H32: [0, 0, 1, 1.5, 1.5, 1.5, 1.5, 2],
    H34: [0, 1, 1.5, 2, 2, 2.5, 2.5, 3],
  },
  '6061': {
    O: [0, 0, 0, 1, 1, 1, 1.5, 2],
    T4: [0, 0, 1, 1.5, 2.5, 3, 3.5, 4],
    T6: [1, 1, 1.5, 2.5, 3, 3.5, 4.5, 5],
  },
};

/** The tempers each alloy's row lists, in the table's order — what a caller may pass as `temper`. */
export const ALUMINUM_BEND_TEMPERS: Readonly<Record<AluminumBendAlloy, readonly AluminumBendTemper[]>> = {
  '5052': Object.keys(TABLE['5052']) as AluminumBendTemper[],
  '6061': Object.keys(TABLE['6061']) as AluminumBendTemper[],
};

/**
 * Temper assumed when none is given — the one the library's own material table lists for each
 * alloy (`A6061-T6`, `A5052-H32`). For 6061 it is also the most demanding of the three tabulated.
 */
export const DEFAULT_ALUMINUM_BEND_TEMPER: Readonly<Record<AluminumBendAlloy, AluminumBendTemper>> = {
  '5052': 'H32',
  '6061': 'T6',
};

/**
 * Minimum recommended bend radius for aluminium sheet and plate, read from the Aluminum
 * Association table.
 *
 * The limit is a multiple of thickness that rises with both thickness and temper: 6061-T6 needs
 * 1.5× at 1.6 mm but 2.5× at 3.2 mm and 5× at 12.7 mm, and 6061-O needs none until 3.2 mm. A single
 * multiplier is therefore wrong at most thicknesses.
 *
 * A thickness between two columns reads the next thicker one — the more demanding limit — and the
 * thinnest column serves everything below it. The table stops at 12.7 mm (1/2 in); beyond it the
 * function returns `null` instead of extrapolating.
 *
 * The radii are for bending without fracture in a standard press brake with air-bend dies. The
 * table does not distinguish bends across and along the grain, and other forming operations may
 * need larger or permit smaller radii.
 *
 * @reference Aluminum Association, Aluminum Standards and Data — Recommended Minimum Bend Radii
 *   for 90 Degree Cold Forming of Sheet and Plate (Aluminum Design Manual Table 3-1).
 * @param input - alloy, temper and thickness in mm
 * @returns the radius with the column it was read from, or `null` past 12.7 mm
 * @throws RangeError if thickness ≤ 0, or the temper is not one the alloy's row lists
 */
export function minBendRadiusAluminum(
  input: MinBendRadiusAluminumInput,
): MinBendRadiusAluminumResult | null {
  requireFinite('minBendRadiusAluminum', input);
  const { alloy, temper, thickness } = input;

  if (!Object.hasOwn(TABLE, alloy)) {
    throw inputRangeError(`alloy must be one of ${Object.keys(TABLE).join(', ')}, got ${String(alloy)}`, {
      code: 'unknown_option', parameter: 'alloy', got: String(alloy),
    });
  }
  const row = Object.hasOwn(TABLE[alloy], temper) ? TABLE[alloy][temper] : undefined;
  if (!row) {
    throw inputRangeError(
      `temper for ${alloy} must be one of ${Object.keys(TABLE[alloy]).join(', ')}, got ${String(temper)}`,
      { code: 'unknown_option', parameter: 'temper', got: String(temper) },
    );
  }
  if (!(thickness > 0)) {
    throw inputRangeError('thickness must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'thickness', exclusive_min: 0, got: thickness,
    });
  }
  if (thickness > ALUMINUM_BEND_MAX_THICKNESS) return null;

  const column = THICKNESS_COLUMN_UPPER.findIndex((upper) => thickness <= upper);
  const multiplier = row[column];

  return {
    minBendRadius: roundTo(multiplier * thickness, 4),
    multiplier,
    thicknessColumnUpper: THICKNESS_COLUMN_UPPER[column],
    alloy,
    temper,
  };
}
