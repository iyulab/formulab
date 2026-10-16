import { roundTo, requireFinite } from '../utils.js';
import { minBendRadiusDin6935 } from './minBendRadius.js';
import { assertBendDomain, EXTREME_BEND_ANGLE, resolveKFactor } from './bendDomain.js';
import type {
  BendAllowanceInput,
  BendAllowanceResult,
  BendingMaterial,
  Din6935StrengthClass,
  MinBendRadiusBasis,
} from './types.js';
import { Notes } from '../diagnostics.js';

/**
 * Minimum bend radius multiplier (x thickness) by material.
 *
 * Like the K-factor defaults (`bendDomain.ts`), these are conventional shop defaults, not values
 * drawn from a specific standard's table. Treat them as a starting point for a
 * feasibility check, not a specification limit; verify against tooling and material
 * datasheets for production use.
 *
 * These stay conventions because no normative table has been sourced for these alloys.
 * Steel is resolved from a standard instead, and reaches this fallback only past the
 * thicknesses that table covers; the dispatch is at the call site, not here.
 *
 * aluminum6061 in particular: minimum bend radius for this alloy varies several-fold
 * with temper (O/T4/T6), so a single multiplier is a rougher approximation here than
 * for the other materials in this table.
 */
const MIN_BEND_RADIUS_MULTIPLIER: Record<BendingMaterial, number> = {
  mildSteel: 1.0,
  stainless304: 2.0,
  aluminum5052: 1.0,
  aluminum6061: 1.5,
  custom: 1.5,
};

/**
 * DIN 6935 strength class assumed for `mildSteel`.
 *
 * The canonical mild steel of the standard's own material list is Q St 37, whose guaranteed
 * minimum tensile strength puts it in the lowest class — which is also the class with the
 * smallest radii, so a caller working a stronger steel is under-warned rather than the
 * limit being overstated for everyone. Callers who know their grade should read
 * `minBendRadiusDin6935` directly with the right class.
 *
 * @reference DIN 6935:2010-01, Table 3 (material list, per DIN 17100).
 */
const MILD_STEEL_STRENGTH_CLASS: Din6935StrengthClass = 'upTo390';

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
 * At a closed hem (180°) the bend allowance is defined but the mold lines never meet, so
 * `outsideSetback` and `bendDeduction` are `null` there (they diverge as θ → 180°).
 *
 * @throws RangeError if material is unknown and no kFactor is given, thickness ≤ 0, insideRadius < 0,
 *   bendAngle is not in (0, 180], or kFactor is outside [0, 1]
 */
export function bendAllowance(input: BendAllowanceInput): BendAllowanceResult {
  requireFinite('bendAllowance', input);
  const {
    thickness,
    bendAngle,
    insideRadius,
    material = 'mildSteel',
    rollingDirection = 'longitudinal',
  } = input;
  const notes = new Notes();

  const kFactor = resolveKFactor(material, input.kFactor);
  assertBendDomain({ thickness, bendAngle, insideRadius, kFactor }, { allowClosedHem: true });

  // Minimum bend radius: read the normative table where one covers this material, and fall
  // back to the conventional multiplier only where it does not. A flat multiple of thickness
  // understates the steel limit in ordinary plate thicknesses, and this figure decides a
  // warning rather than merely being displayed.
  const din6935 =
    material === 'mildSteel'
      ? minBendRadiusDin6935({
          thickness,
          strengthClass: MILD_STEEL_STRENGTH_CLASS,
          rollingDirection,
          bendAngle,
        })
      : null;
  const minBendRadius = din6935?.minBendRadius ?? MIN_BEND_RADIUS_MULTIPLIER[material] * thickness;
  const minBendRadiusBasis: MinBendRadiusBasis = din6935 ? 'din6935' : 'convention';

  // Calculate recommended V-die opening
  const recommendedVDie = roundTo(V_DIE_MULTIPLIER * thickness, 0);

  // Warn if inside radius is less than minimum
  if (insideRadius < minBendRadius) {
    notes.add(`Inside radius (${insideRadius}mm) is less than minimum recommended (${minBendRadius}mm)`, {
      code: 'bend_radius_below_minimum', parameter: 'insideRadius', got: insideRadius, min: minBendRadius,
    });
  }

  // Warn for extreme bend angles
  if (bendAngle > EXTREME_BEND_ANGLE) {
    notes.add(`Extreme bend angle (${bendAngle}) may cause springback issues`, {
      code: 'bend_angle_extreme', parameter: 'bendAngle', got: bendAngle, max: EXTREME_BEND_ANGLE,
    });
  }

  // Convert bend angle to radians
  const bendAngleRad = (bendAngle * Math.PI) / 180;

  // Calculate Bend Allowance (BA)
  // BA = (angle in radians) x (inside radius + K-factor x thickness)
  const ba = bendAngleRad * (insideRadius + kFactor * thickness);

  // Calculate Outside Setback (OSSB)
  // OSSB = (inside radius + thickness) x tan(angle / 2)
  // At a closed hem tan(90°) diverges: there is no setback to state.
  const closedHem = bendAngle === 180;
  const halfAngleRad = bendAngleRad / 2;
  const ossb = closedHem ? null : (insideRadius + thickness) * Math.tan(halfAngleRad);

  // Calculate Bend Deduction (BD)
  // BD = 2 x OSSB - BA
  const bd = ossb === null ? null : 2 * ossb - ba;

  return {
    bendAllowance: ba,
    bendDeduction: bd,
    outsideSetback: ossb,
    kFactor,
    recommendedVDie,
    minBendRadius,
    minBendRadiusBasis,
    warnings: notes.warnings,
    diagnostics: notes.diagnostics,
  };
}
