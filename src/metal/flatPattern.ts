import type { FlatPatternInput, FlatPatternResult, BendingMaterial } from './types.js';

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

  return {
    flatLength,
    bendAllowance: ba,
    bendDeduction: bd,
    kFactor,
  };
}
