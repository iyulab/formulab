import type { ElementType, FormworkInput, FormworkResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Standard plywood sheet area (4' x 8' = 1.22m x 2.44m = 2.9768 m²)
 */
const PLYWOOD_SHEET_AREA = 2.9768;

/**
 * Calculate formwork area for a single element
 * @param elementType - Type of structural element
 * @param length - Length in meters
 * @param width - Width in meters
 * @param height - Height in meters
 * @returns Area in m²
 */
function calculateSingleArea(
  elementType: ElementType,
  length: number,
  width: number,
  height: number
): number {
  switch (elementType) {
    case 'column':
      // Column: 4 sides = 2*(L+W) * H
      return roundTo(2 * (length + width) * height, 2);

    case 'beam':
      // Beam: 2 sides + bottom = 2*H*L + W*L
      return roundTo(2 * height * length + width * length, 2);

    case 'slab':
      // Slab: bottom only = L * W
      return roundTo(length * width, 2);

    case 'wall':
      // Wall: 2 sides = 2 * L * H
      return roundTo(2 * length * height, 2);

    case 'footing':
      // Footing: 4 sides = 2*(L+W) * H
      return roundTo(2 * (length + width) * height, 2);

    default:
      return 0;
  }
}

/**
 * Calculate formwork area requirements
 *
 * @param input - Formwork calculation parameters
 * @returns Formwork area results
 */
export function formwork(input: FormworkInput): FormworkResult {
  const { elementType, length, width, height, quantity, reuses } = input;

  // Calculate area for single element
  const singleAreaSqm = calculateSingleArea(elementType, length, width, height);

  // Total area = single area × quantity
  const totalAreaSqm = roundTo(singleAreaSqm * quantity, 2);

  // Effective area accounts for reuses
  const effectiveReuses = reuses > 0 ? reuses : 1;
  const effectiveAreaSqm = roundTo(totalAreaSqm / effectiveReuses, 2);

  // Number of plywood sheets needed (round up)
  const plywoodSheets = effectiveAreaSqm > 0
    ? Math.ceil(effectiveAreaSqm / PLYWOOD_SHEET_AREA)
    : 0;

  return {
    singleAreaSqm,
    totalAreaSqm,
    effectiveAreaSqm,
    plywoodSheets,
  };
}
