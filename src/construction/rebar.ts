import type { RebarSize, RebarInput, RebarResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Rebar unit weights in kg/m
 *
 * The D-size designations (D10..D32) are the Korean deformed-bar (이형 봉강) naming convention.
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
 * This resolves a previously-open provenance gap (2026-08-11/2026-08-19 secondary-source checks
 * were inconclusive, see claudedocs/issues in this repo's history) and corrects six of the eight
 * entries, which turned out to differ from the primary standard by 1-10% (the generic
 * d² x 0.00617 formula this table previously used as a fallback was itself never a cited source —
 * D16 and D25 happened to already carry the correct KS figure from an earlier fix, D10/D13/D19/
 * D22/D29/D32 did not).
 */
const REBAR_UNIT_WEIGHTS: Record<RebarSize, number> = {
  D10: 0.560,
  D13: 0.995,
  D16: 1.56,
  D19: 2.25,
  D22: 3.04,
  D25: 3.98,
  D29: 5.04,
  D32: 6.23,
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
