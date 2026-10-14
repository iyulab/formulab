import type { FlatPatternInput, FlatPatternResult, BendingMaterial } from './types.js';
import { assertBendDomain } from './bendDomain.js';

/**
 * Default K-factor values by material
 */
const K_FACTOR_TABLE: Record<BendingMaterial, number> = {
  mildSteel: 0.44,
  stainless304: 0.45,
  aluminum5052: 0.40,
  aluminum6061: 0.42,
  custom: 0.44,
};

/**
 * Calculate flat pattern length for bent sheet metal.
 *
 * For L-shape: Flat Length = flangeA + flangeB - Bend Deduction
 * For U-shape: Flat Length = flangeA + flangeB + flangeC - 2 x Bend Deduction
 *
 * @param input - Flat pattern input parameters
 * @returns FlatPatternResult with flat length, BA, BD, and K-factor
 * @throws RangeError if thickness ≤ 0, insideRadius < 0, bendAngle is not strictly between 0 and 180°,
 *   kFactor is outside [0, 1], a flange length (flangeC for a U-shape) is not positive, or the resulting
 *   flat length is not positive (flanges shorter than the bend deductions — no such part exists)
 */
export function flatPattern(input: FlatPatternInput): FlatPatternResult {
  const {
    shapeType,
    thickness,
    bendAngle,
    insideRadius,
    material = 'mildSteel',
    flangeA,
    flangeB,
    flangeC = 0,
  } = input;

  // Get K-factor: use provided or default from table
  const kFactor = input.kFactor ?? K_FACTOR_TABLE[material];
  assertBendDomain({ thickness, bendAngle, insideRadius, kFactor });
  if (!(flangeA > 0) || !(flangeB > 0) || (shapeType !== 'lShape' && !(flangeC > 0))) {
    throw new RangeError('flange lengths must be greater than 0');
  }

  // Convert bend angle to radians
  const bendAngleRad = (bendAngle * Math.PI) / 180;

  // Calculate Bend Allowance (BA)
  const ba = bendAngleRad * (insideRadius + kFactor * thickness);

  // Calculate Outside Setback (OSSB)
  const halfAngleRad = bendAngleRad / 2;
  const ossb = (insideRadius + thickness) * Math.tan(halfAngleRad);

  // Calculate Bend Deduction (BD)
  const bd = 2 * ossb - ba;

  // Calculate flat length based on shape type
  let flatLength: number;

  if (shapeType === 'lShape') {
    // L-shape: one bend
    flatLength = flangeA + flangeB - bd;
  } else {
    // U-shape: two bends
    flatLength = flangeA + flangeB + flangeC - 2 * bd;
  }

  if (!(flatLength > 0)) {
    throw new RangeError('flatLength must be greater than 0: the flanges are shorter than the bend deductions');
  }

  return {
    flatLength,
    bendAllowance: ba,
    bendDeduction: bd,
    kFactor,
  };
}
