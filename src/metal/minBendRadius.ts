import type {
  MinBendRadiusDin6935Input,
  MinBendRadiusDin6935Result,
  Din6935StrengthClass,
} from './types.js';

/**
 * Minimum permissible bend radius for cold-bent flat steel, per DIN 6935.
 *
 * The standard does not express this limit as a single multiple of thickness. It resolves
 * from three inputs at once — the sheet thickness band, the guaranteed minimum tensile
 * strength class, and whether the bend runs across or along the rolling direction — and the
 * resulting effective multiple is not constant: it is 1.0x at the thinnest band and reaches
 * roughly 2.0x in ordinary plate thicknesses. A flat multiplier therefore understates the
 * limit exactly where sheet metal work most often sits.
 *
 * @reference DIN 6935:2010-01, Table 1 (Menores radios de doblado r permitidos). Clause 1
 *   limits the standard to flat steel products; Table 3 lists the covered grades (general
 *   structural steels per DIN 17100). Aluminium and stainless alloys are outside its scope
 *   and are not served by this function.
 */

/** Upper bound (inclusive, mm) of each thickness band in Table 1, in column order. */
const THICKNESS_BAND_UPPER = [
  1, 1.5, 2.5, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 18, 20,
] as const;

/**
 * Table 1 values in mm: one row per thickness band (aligned with THICKNESS_BAND_UPPER),
 * each row ordered [transverse, longitudinal] for the three tensile strength classes.
 *
 * The class boundaries read as <=390 / >390..490 / >490..640 N/mm2. The Spanish translation
 * prints "hasta 380" in the Table 1 header alone; that is a typo, since Table 2 and Table 3
 * both print "hasta 390" for the same class and only 390 leaves the boundary contiguous with
 * the ">390" of the next column.
 *
 * @reference DIN 6935:2010-01, Table 1.
 */
const TABLE_1: readonly (readonly [number, number, number, number, number, number])[] = [
  //  c1T   c1L   c2T   c2L   c3T   c3L      thickness band (mm)
  [1, 1, 1.2, 1.2, 1.6, 1.6], //             up to 1
  [1.6, 1.6, 2, 2, 2.5, 2.5], //             over 1 up to 1.5
  [2.5, 2.5, 3, 3, 4, 4], //                 over 1.5 up to 2.5
  [3, 3, 4, 4, 5, 5], //                     over 2.5 up to 3
  [5, 6, 5, 6, 6, 8], //                     over 3 up to 4
  [6, 8, 8, 10, 8, 10], //                   over 4 up to 5
  [8, 10, 10, 12, 10, 12], //                over 5 up to 6
  [10, 12, 12, 16, 12, 16], //               over 6 up to 7
  [12, 16, 16, 20, 16, 20], //               over 7 up to 8
  [16, 20, 20, 25, 20, 25], //               over 8 up to 10
  [20, 25, 25, 32, 25, 32], //               over 10 up to 12
  [25, 28, 28, 36, 32, 36], //               over 12 up to 14
  [28, 32, 32, 40, 36, 40], //               over 14 up to 16
  [36, 40, 40, 45, 45, 50], //               over 16 up to 18
  [40, 45, 45, 50, 50, 63], //               over 18 up to 20
];

/** Largest thickness Table 1 covers, in mm. */
export const DIN_6935_MAX_THICKNESS = THICKNESS_BAND_UPPER[THICKNESS_BAND_UPPER.length - 1];

const CLASS_COLUMN: Record<Din6935StrengthClass, number> = {
  upTo390: 0,
  over390UpTo490: 2,
  over490UpTo640: 4,
};

/**
 * Bend angle above which Clause 3 requires the next larger radius.
 *
 * Clause 3 says to take "the immediately higher value in the table" — the next thickness
 * column of the same row, not the next entry of the preferred radius series printed above
 * it. The two readings agree on the standard's own worked example (6 mm Q St 42-2 bent
 * across the rolling direction: 10 mm at or below this angle, 12 mm above it) but diverge
 * at the thinnest band, where the row steps 1 -> 1.6 while the series steps 1 -> 1.2.
 *
 * @reference DIN 6935:2010-01, Clause 3.
 */
const NEXT_SIZE_UP_ABOVE_ANGLE = 120;

/**
 * Resolve the minimum permissible bend radius from DIN 6935 Table 1.
 *
 * Returns `null` when the input falls outside what the standard covers rather than
 * extrapolating: the table stops at 20 mm, and a bend angle above 120 degrees at the last
 * band has no higher value to step to. Reading past the table would be this function
 * inventing a limit the standard does not state.
 *
 * @param input - thickness, strength class, rolling direction, and bend angle
 * @returns the resolved radius with the band it came from, or `null` when out of scope
 */
export function minBendRadiusDin6935(
  input: MinBendRadiusDin6935Input,
): MinBendRadiusDin6935Result | null {
  const { thickness, strengthClass, rollingDirection, bendAngle = 90 } = input;

  if (!Number.isFinite(thickness) || thickness <= 0) {
    throw new Error('thickness must be a positive number');
  }
  if (thickness > DIN_6935_MAX_THICKNESS) return null;

  const bandIndex = THICKNESS_BAND_UPPER.findIndex((upper) => thickness <= upper);
  const column = CLASS_COLUMN[strengthClass] + (rollingDirection === 'longitudinal' ? 1 : 0);
  const tabulated = TABLE_1[bandIndex][column];

  if (bendAngle <= NEXT_SIZE_UP_ABOVE_ANGLE) {
    return {
      minBendRadius: tabulated,
      tabulatedRadius: tabulated,
      thicknessBandUpper: THICKNESS_BAND_UPPER[bandIndex],
      strengthClass,
      rollingDirection,
      nextSizeUpApplied: false,
    };
  }

  const nextBand = TABLE_1[bandIndex + 1];
  if (!nextBand) return null;

  return {
    minBendRadius: nextBand[column],
    tabulatedRadius: tabulated,
    thicknessBandUpper: THICKNESS_BAND_UPPER[bandIndex],
    strengthClass,
    rollingDirection,
    nextSizeUpApplied: true,
  };
}
