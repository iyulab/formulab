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
 * @returns Exact area in m², deliberately unrounded — the caller multiplies this by the
 *   element quantity and divides by the reuse count before anything is displayed, so a
 *   two-decimal value here would be scaled by the quantity rather than absorbed.
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
      return 2 * (length + width) * height;

    case 'beam':
      // Beam: 2 sides + bottom = 2*H*L + W*L
      return 2 * height * length + width * length;

    case 'slab':
      // Slab: bottom only = L * W
      return length * width;

    case 'wall':
      // Wall: 2 sides = 2 * L * H
      return 2 * length * height;

    case 'footing':
      // Footing: 4 sides = 2*(L+W) * H
      return 2 * (length + width) * height;

    default:
      return 0;
  }
}

/**
 * Validate that the dimensions actually consumed by an element type's area
 * formula are positive. Dimensions not used by a given element type are left
 * unvalidated (e.g. a slab ignores height, a wall ignores width).
 */
function validateDimensions(
  elementType: ElementType,
  length: number,
  width: number,
  height: number
): void {
  if (length <= 0) {
    throw new RangeError('length must be greater than 0');
  }
  switch (elementType) {
    case 'column':
    case 'beam':
    case 'footing':
      if (width <= 0) throw new RangeError('width must be greater than 0');
      if (height <= 0) throw new RangeError('height must be greater than 0');
      break;
    case 'slab':
      if (width <= 0) throw new RangeError('width must be greater than 0');
      break;
    case 'wall':
      if (height <= 0) throw new RangeError('height must be greater than 0');
      break;
  }
}

/**
 * Calculate formwork area requirements
 *
 * @param input - Formwork calculation parameters
 * @returns Formwork area results
 * @throws RangeError if a dimension consumed by the element type's area formula
 *   is not positive (column/beam/footing: length, width, height; slab: length,
 *   width; wall: length, height), or if quantity is not positive
 */
export function formwork(input: FormworkInput): FormworkResult {
  const { elementType, length, width, height, quantity, reuses } = input;

  validateDimensions(elementType, length, width, height);

  if (quantity <= 0) {
    throw new RangeError('quantity must be greater than 0');
  }

  // Every figure below derives from the exact contact area; rounding happens once, on
  // the way out. Rounding the single-element area to two decimals and then multiplying
  // by the quantity makes that quantity the amplifier of a display artefact: half a
  // square centimetre per element becomes six square metres over twelve hundred of
  // them, and Math.ceil then turns the drift into whole sheets of plywood that would
  // actually be ordered.
  const singleAreaExact = calculateSingleArea(elementType, length, width, height);
  const totalAreaExact = singleAreaExact * quantity;

  // Effective area accounts for reuses
  const effectiveReuses = reuses > 0 ? reuses : 1;
  const effectiveAreaExact = totalAreaExact / effectiveReuses;

  // Number of plywood sheets needed (round up)
  const plywoodSheets = effectiveAreaExact > 0
    ? Math.ceil(effectiveAreaExact / PLYWOOD_SHEET_AREA)
    : 0;

  return {
    singleAreaSqm: roundTo(singleAreaExact, 2),
    totalAreaSqm: roundTo(totalAreaExact, 2),
    effectiveAreaSqm: roundTo(effectiveAreaExact, 2),
    plywoodSheets,
  };
}
