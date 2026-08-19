import type { RebarSize, RebarInput, RebarResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Rebar unit weights in kg/m
 *
 * The D-size designations (D10..D32) are the Korean/JIS deformed-bar naming convention. Most
 * entries equal the generic d² x 0.00617 nominal-weight formula (d = designation number in mm,
 * 0.00617 approximating steel density over a circular cross-section); D16 and D25 instead carry
 * an already-published "standard" figure that differs slightly from that formula (see per-entry
 * comments) — but the specific standard responsible for those two overrides (KS D 3504? a
 * particular mill's published table?) is not cited here, and a 2026-08-11 doc audit could not
 * confirm it from freely available sources (see claudedocs/issues in this repo).
 *
 * A 2026-08-19 follow-up check found two independently-published Korean rebar unit-weight tables
 * (informational/vendor pages, not the primary KS D 3504 text itself) that closely match D16 and
 * D25's override figures here — but diverge from this table's *formula*-derived entries for D10,
 * D13, D29, and D32 by several percent, and disagree with each other on D22. So the provenance
 * doubt is not confined to D16/D25: the generic-formula entries may also not match the actual
 * published table. No value here has been changed on that basis — neither source names an
 * edition, so neither clears this project's citation bar (see the issue draft for the full
 * comparison).
 *
 * Do not swap ANY of these for another unconfirmed secondary-source value without resolving which
 * standard applies.
 */
const REBAR_UNIT_WEIGHTS: Record<RebarSize, number> = {
  D10: 0.617,  // 10² × 0.00617 = 0.617
  D13: 1.04,   // 13² × 0.00617 ≈ 1.04
  D16: 1.56,   // 16² × 0.00617 ≈ 1.58 (standard figure used instead: 1.56)
  D19: 2.23,   // 19² × 0.00617 ≈ 2.23
  D22: 2.98,   // 22² × 0.00617 ≈ 2.98
  D25: 3.98,   // 25² × 0.00617 ≈ 3.85 (standard figure used instead: 3.98)
  D29: 5.18,   // 29² × 0.00617 ≈ 5.19
  D32: 6.31,   // 32² × 0.00617 ≈ 6.31
};

/**
 * Get the unit weight of a rebar size
 *
 * @param size - Rebar size designation (D10, D13, etc.)
 * @returns Unit weight in kg/m
 */
export function getRebarUnitWeight(size: RebarSize): number {
  return REBAR_UNIT_WEIGHTS[size];
}

/**
 * Calculate total rebar weight
 *
 * @param input - Rebar size, length, and quantity
 * @returns Rebar weight calculation results
 * @throws {RangeError} size is not a known rebar designation (D10–D32)
 */
export function rebarWeight(input: RebarInput): RebarResult {
  const { size, length, quantity } = input;

  const unitWeight = REBAR_UNIT_WEIGHTS[size];
  if (unitWeight === undefined) {
    throw new RangeError(`unknown rebar size: ${String(size)}`);
  }
  const totalLength = roundTo(length * quantity, 2);
  const totalWeight = roundTo(unitWeight * totalLength, 2);

  return {
    unitWeight,
    totalLength,
    totalWeight,
  };
}
