import type { RebarSize, RebarInput, RebarResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Rebar unit weights in kg/m
 * Based on standard deformed bar specifications
 * Weight = (d² × 0.00617) where d = diameter in mm
 */
const REBAR_UNIT_WEIGHTS: Record<RebarSize, number> = {
  D10: 0.617,  // 10² × 0.00617 = 0.617
  D13: 1.04,   // 13² × 0.00617 ≈ 1.04
  D16: 1.56,   // 16² × 0.00617 ≈ 1.58 (standard 1.56)
  D19: 2.23,   // 19² × 0.00617 ≈ 2.23
  D22: 2.98,   // 22² × 0.00617 ≈ 2.98
  D25: 3.98,   // 25² × 0.00617 ≈ 3.85 (standard 3.98)
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
 */
export function rebarWeight(input: RebarInput): RebarResult {
  const { size, length, quantity } = input;

  const unitWeight = REBAR_UNIT_WEIGHTS[size];
  const totalLength = roundTo(length * quantity, 2);
  const totalWeight = roundTo(unitWeight * totalLength, 2);

  return {
    unitWeight,
    totalLength,
    totalWeight,
  };
}
