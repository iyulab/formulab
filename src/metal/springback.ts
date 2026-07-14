import { roundTo } from '../utils.js';
import type { SpringbackInput, SpringbackResult, BendingMaterial } from './types.js';

/**
 * Yield strength (MPa) and Young's modulus (GPa) presets, matched to the material
 * enum used by bendAllowance() so a bend workflow keeps one material selection.
 * Room-temperature reference values (ASM Handbook · MatWeb datasheets).
 */
const MATERIAL_PROPS: Record<Exclude<BendingMaterial, 'custom'>, { yieldStrength: number; elasticModulus: number }> = {
  mildSteel: { yieldStrength: 250, elasticModulus: 200 },     // A36 / 1018
  stainless304: { yieldStrength: 215, elasticModulus: 193 },  // 304 annealed
  aluminum5052: { yieldStrength: 193, elasticModulus: 70 },   // 5052-H32
  aluminum6061: { yieldStrength: 276, elasticModulus: 69 },   // 6061-T6
};

/**
 * Sheet-metal springback: how much a bend elastically opens up after the tool is
 * released, and how far to overbend so the part lands on the target angle.
 *
 * The elastic core of a bent sheet recovers on unloading, so the final radius is
 * always larger (and the final angle shallower) than the tool's. The recovery
 * grows with the R/t ratio and with the yield-strength-to-stiffness ratio Y/E —
 * which is why aluminium springs back far more than steel at the same geometry.
 *
 * @formula x  = Y · R_i / (E · T)                (dimensionless, model domain x < 0.5)
 * @formula Ks = R_i / R_f = 4x³ − 3x + 1         (springback factor, 0 < Ks ≤ 1 on the domain)
 * @formula R_f = R_i / Ks · θ_final = θ_tool · Ks ⇒ θ_overbend = θ_target / Ks
 * @reference Kalpakjian & Schmid, "Manufacturing Engineering and Technology",
 *            springback equation for pure bending (also in ASM Metals Handbook
 *            Vol. 14B, Sheet Forming). Valid for R_i > 2T, where the neutral axis
 *            sits at mid-thickness; θ scales with Ks because the neutral-axis arc
 *            length is conserved through unloading.
 *
 *            Model domain: the cubic factors as Ks = (x + 1)(2x − 1)², a double root
 *            at x = 0.5 — which is exactly the elastic limit: x ≥ 0.5 ⇔ the maximum
 *            bending strain T/2R_i stays at or below the yield strain Y/E, so the
 *            sheet never yields and springs back completely (no permanent set).
 *            Past the root the polynomial climbs again (x = 1 → Ks = 2, i.e. negative
 *            springback), which is a mathematical artifact with no physical meaning,
 *            so inputs with x ≥ 0.5 are rejected rather than evaluated (ISSUE-20260714:
 *            the unguarded cubic returned Infinity at x = 0.5 and shrinking radii beyond).
 * @units thickness/bendRadius mm · bendAngle degrees · yieldStrength MPa · elasticModulus GPa
 * @validation thickness > 0, bendRadius > 0, 0 < bendAngle < 180; for material
 *             'custom', yieldStrength > 0 and elasticModulus > 0 are required;
 *             x = Y·R_i/(E·T) < 0.5 (below the elastic limit, see @reference).
 * Even inside the domain the required overbend can pass 180° (thin sheet, large radius,
 * target angle near 180°) — a valid model prediction that no single press-brake stroke
 * can execute. The result discloses this via `overbendExceeds180` instead of throwing:
 * the number itself still tells the fabricator the part cannot be made in one hit.
 *
 * Tight bends (R_i ≤ 2T) are common in practice but sit below the model's stated
 * validity (the neutral axis shifts off mid-thickness), so rather than rejecting them
 * the result discloses the accuracy caveat via `radiusBelow2T`.
 *
 * @param input - Geometry plus material (preset or custom Y/E)
 * @returns Springback factor, final radius, springback angle, overbend angle, and
 *          disclosure flags: `overbendExceeds180` when the overbend is not achievable
 *          in a single bend, `radiusBelow2T` when the geometry is below the model's
 *          stated validity (R_i > 2T)
 * @throws {RangeError} thickness, bendRadius or bendAngle out of range
 * @throws {RangeError} material is 'custom' but yieldStrength/elasticModulus missing or non-positive
 * @throws {RangeError} x = Y·R_i/(E·T) ≥ 0.5 — the bend stays fully elastic (no permanent
 *                      set), outside the springback model's domain
 */
export function springback(input: SpringbackInput): SpringbackResult {
  const { thickness, bendRadius, bendAngle, material = 'mildSteel' } = input;

  if (!(thickness > 0)) {
    throw new RangeError('thickness must be greater than 0');
  }
  if (!(bendRadius > 0)) {
    throw new RangeError('bendRadius must be greater than 0');
  }
  if (!(bendAngle > 0) || bendAngle >= 180) {
    throw new RangeError('bendAngle must be between 0 and 180 degrees');
  }

  let yieldStrength: number;
  let elasticModulus: number;
  if (material === 'custom') {
    yieldStrength = input.yieldStrength ?? NaN;
    elasticModulus = input.elasticModulus ?? NaN;
    if (!(yieldStrength > 0)) {
      throw new RangeError('yieldStrength must be greater than 0 for custom material');
    }
    if (!(elasticModulus > 0)) {
      throw new RangeError('elasticModulus must be greater than 0 for custom material');
    }
  } else {
    ({ yieldStrength, elasticModulus } = MATERIAL_PROPS[material]);
  }

  // Y is MPa and E is GPa — convert E so x stays dimensionless.
  const eMPa = elasticModulus * 1000;
  const x = (yieldStrength * bendRadius) / (eMPa * thickness);

  // x ≥ 0.5 ⇔ max bending strain T/2R_i ≤ yield strain Y/E: the sheet never yields,
  // springs back completely, and the cubic below leaves its physical branch (double
  // root at x = 0.5, then Ks > 1 ⇒ negative springback). See @reference.
  if (x >= 0.5) {
    throw new RangeError(
      `bend stays fully elastic (x = Y*R/(E*T) = ${x.toFixed(4)} >= 0.5): the sheet takes no ` +
      'permanent set at this radius/thickness/material, outside the springback model domain (x < 0.5)',
    );
  }

  const springbackFactor = 4 * x ** 3 - 3 * x + 1;

  const finalRadius = bendRadius / springbackFactor;
  const overbendAngle = bendAngle / springbackFactor;
  const springbackAngle = overbendAngle - bendAngle;

  return {
    springbackFactor: roundTo(springbackFactor, 4),
    finalRadius: roundTo(finalRadius, 2),
    springbackAngle: roundTo(springbackAngle, 2),
    overbendAngle: roundTo(overbendAngle, 2),
    // Compared before rounding: a bend needs a tool angle < 180° (same bound the target
    // angle is validated against), so ≥ 180° means "not reachable in a single bend".
    overbendExceeds180: overbendAngle >= 180,
    // The @reference validity is R_i > 2T (neutral axis at mid-thickness), so equality
    // is already outside it. Tight bends are routine — disclose, don't reject.
    radiusBelow2T: bendRadius <= 2 * thickness,
    yieldStrength,
    elasticModulus,
  };
}
