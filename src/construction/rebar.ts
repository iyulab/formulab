import type { RebarSize, RebarInput, RebarResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Rebar unit weights in kg/m
 *
 * The D-size designations are the Korean deformed-bar (이형 봉강) naming convention. D10-D32 are
 * the range in common structural use; D35-D57 are the standard's larger heavy-section sizes.
 *
 * @reference KS D 3504:2025 (개정 2025-06-02, 고시번호 2025-0089), 표 4 — 치수, 무게 및 횡방향
 *   리브의 허용차 ("Dimensions, weight, and transverse-rib tolerances"), 단위 무게 (unit weight)
 *   column. Read directly from the standard's own official text (streamdocsId
 *   72340856797910834, via standard.go.kr's KS D 3504 detail page → "고시원문 보기") on
 *   2026-08-28, not a secondary/vendor source. Cross-checked against the table's own disclosed
 *   formula (비고 1: 단위무게 = 0.00785 × 공칭단면적(S), S = 0.7854 × d²) — every value below
 *   reproduces to the table's own rounding, confirming an accurate read rather than a
 *   transcription slip.
 *
 * D10-D32 resolved a previously-open provenance gap (2026-08-11/2026-08-19 secondary-source
 * checks were inconclusive, see claudedocs/issues in this repo's history) and corrected six of
 * the eight entries, which turned out to differ from the primary standard by 1-10% (the generic
 * d² x 0.00617 formula this table previously used as a fallback was itself never a cited source —
 * D16 and D25 happened to already carry the correct KS figure from an earlier fix, D10/D13/D19/
 * D22/D29/D32 did not).
 *
 * D35-D57 and D4-D8 were added later, from the same table read and the same formula cross-check
 * (all thirteen sizes reproduce the formula to the table's own rounding) — this now covers every
 * size KS D 3504:2025's Table 4 publishes, with no gap in the band.
 */
const REBAR_UNIT_WEIGHTS: Record<RebarSize, number> = {
  D4: 0.110,
  D5: 0.173,
  D6: 0.249,
  D7: 0.302,
  D8: 0.389,
  D10: 0.560,
  D13: 0.995,
  D16: 1.56,
  D19: 2.25,
  D22: 3.04,
  D25: 3.98,
  D29: 5.04,
  D32: 6.23,
  D35: 7.51,
  D38: 8.95,
  D41: 10.5,
  D43: 11.4,
  D51: 15.9,
  D57: 20.2,
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
 * @throws {RangeError} size is not a known rebar designation (D4–D8, D10–D32, D35–D57)
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
