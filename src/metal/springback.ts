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
 * @formula x  = Y · R_i / (E · T)                (dimensionless)
 * @formula Ks = R_i / R_f = 4x³ − 3x + 1         (springback factor, ≤ 1)
 * @formula R_f = R_i / Ks · θ_final = θ_tool · Ks ⇒ θ_overbend = θ_target / Ks
 * @reference Kalpakjian & Schmid, "Manufacturing Engineering and Technology",
 *            springback equation for pure bending (also in ASM Metals Handbook
 *            Vol. 14B, Sheet Forming). Valid for R_i > 2T, where the neutral axis
 *            sits at mid-thickness; θ scales with Ks because the neutral-axis arc
 *            length is conserved through unloading.
 * @units thickness/bendRadius mm · bendAngle degrees · yieldStrength MPa · elasticModulus GPa
 * @validation thickness > 0, bendRadius > 0, 0 < bendAngle < 180; for material
 *             'custom', yieldStrength > 0 and elasticModulus > 0 are required.
 * @param input - Geometry plus material (preset or custom Y/E)
 * @returns Springback factor, final radius, springback angle, and overbend angle
 * @throws {RangeError} thickness, bendRadius or bendAngle out of range
 * @throws {RangeError} material is 'custom' but yieldStrength/elasticModulus missing or non-positive
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
  const springbackFactor = 4 * x ** 3 - 3 * x + 1;

  const finalRadius = bendRadius / springbackFactor;
  const overbendAngle = bendAngle / springbackFactor;
  const springbackAngle = overbendAngle - bendAngle;

  return {
    springbackFactor: roundTo(springbackFactor, 4),
    finalRadius: roundTo(finalRadius, 2),
    springbackAngle: roundTo(springbackAngle, 2),
    overbendAngle: roundTo(overbendAngle, 2),
    yieldStrength,
    elasticModulus,
  };
}
