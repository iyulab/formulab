import type { BendAllowanceInput, BendAllowanceResult, BendingMaterial } from './types.js';

/**
 * Default K-factor values by material
 * K-factor represents the position of the neutral axis relative to thickness
 */
const K_FACTOR_TABLE: Record<BendingMaterial, number> = {
  mildSteel: 0.44,
  stainless304: 0.45,
  aluminum5052: 0.40,
  aluminum6061: 0.42,
  custom: 0.44,
};

/**
 * Minimum bend radius multiplier (x thickness) by material
 */
const MIN_BEND_RADIUS_MULTIPLIER: Record<BendingMaterial, number> = {
  mildSteel: 1.0,
  stainless304: 2.0,
  aluminum5052: 1.0,
  aluminum6061: 1.5,
  custom: 1.5,
};

/**
 * V-die opening multiplier (standard is 8x thickness)
 */
const V_DIE_MULTIPLIER = 8;

/**
 * Calculate bend allowance and related bending parameters.
 *
 * Bend Allowance (BA) = (bend angle in radians) x (inside radius + K-factor x thickness)
 * Outside Setback (OSSB) = (inside radius + thickness) x tan(bend angle / 2)
 * Bend Deduction (BD) = 2 x OSSB - BA
 *
 * @param input - Bend allowance input parameters
 * @returns BendAllowanceResult with BA, BD, OSSB, K-factor, recommended V-die, min bend radius
 */
export function bendAllowance(input: BendAllowanceInput): BendAllowanceResult {
  const { thickness, bendAngle, insideRadius, material = 'mildSteel' } = input;
  const warnings: string[] = [];

  // Get K-factor: use provided or default from table
  const kFactor = input.kFactor ?? K_FACTOR_TABLE[material];

  // Calculate minimum bend radius
  const minBendRadius = MIN_BEND_RADIUS_MULTIPLIER[material] * thickness;

  // Calculate recommended V-die opening
  const recommendedVDie = Math.round(V_DIE_MULTIPLIER * thickness);

  // Warn if inside radius is less than minimum
  if (insideRadius < minBendRadius) {
    warnings.push(`Inside radius (${insideRadius}mm) is less than minimum recommended (${minBendRadius}mm)`);
  }

  // Warn for extreme bend angles
  if (bendAngle > 170) {
    warnings.push(`Extreme bend angle (${bendAngle}) may cause springback issues`);
  }

  // Convert bend angle to radians
  const bendAngleRad = (bendAngle * Math.PI) / 180;

  // Calculate Bend Allowance (BA)
  // BA = (angle in radians) x (inside radius + K-factor x thickness)
  const ba = bendAngleRad * (insideRadius + kFactor * thickness);

  // Calculate Outside Setback (OSSB)
  // OSSB = (inside radius + thickness) x tan(angle / 2)
  const halfAngleRad = bendAngleRad / 2;
  const ossb = (insideRadius + thickness) * Math.tan(halfAngleRad);

  // Calculate Bend Deduction (BD)
  // BD = 2 x OSSB - BA
  const bd = 2 * ossb - ba;

  return {
    bendAllowance: ba,
    bendDeduction: bd,
    outsideSetback: ossb,
    kFactor,
    recommendedVDie,
    minBendRadius,
    warnings,
  };
}
