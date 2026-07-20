import { roundTo } from '../utils.js';
import type {
  WeldElectrodeClass,
  WeldStrengthInput,
  WeldStrengthResult,
} from './types.js';

/**
 * Minimum tensile strength of deposited weld metal (FEXX), in MPa.
 *
 * The electrode class number is FEXX in ksi (E70 = 70 ksi). Values below are the
 * exact SI conversion of the nominal ksi rating (1 ksi = 6.894757 MPa), rounded to
 * the nearest MPa — NOT eyeballed. E100 = 100 x 6.894757 = 689.48 -> 689 (not 690);
 * E110 = 758.42 -> 758 (not 760).
 */
const FEXX_MPA: Record<WeldElectrodeClass, number> = {
  E60: 414,   // 60 ksi  = 413.69 MPa
  E70: 483,   // 70 ksi  = 482.63 MPa
  E80: 552,   // 80 ksi  = 551.58 MPa
  E90: 621,   // 90 ksi  = 620.53 MPa
  E100: 689,  // 100 ksi = 689.48 MPa
  E110: 758,  // 110 ksi = 758.42 MPa
};

/** Effective-throat factor for an equal-leg, 90-degree fillet weld: t = 0.707 x leg. */
const THROAT_FACTOR = 0.707;

/** AISC ASD allowable shear stress on the weld throat: Fw = 0.30 x FEXX. */
const ASD_SHEAR_FACTOR = 0.30;

/**
 * Calculate the load-carrying capacity of an equal-leg fillet weld (AISC ASD).
 *
 * # Formulas
 * - Effective throat:      t = 0.707 x leg
 * - Effective area:        Aw = t x L x n
 * - Allowable shear stress: Fw = 0.30 x FEXX
 * - Allowable load (capacity): Pallow = Fw x Aw
 * - Actual shear stress:    tau = P / Aw
 * - Utilization:            u = tau / Fw = P / Pallow
 * - Minimum required leg:   leg_min = P / (Fw x 0.707 x L x n)
 *
 * Units are SI throughout: leg/length in mm give Aw in mm^2; Fw in MPa (= N/mm^2)
 * gives Pallow directly in N. Cross-check: E70 -> Fw = 0.30 x 70 = 21 ksi, the
 * classic AISC worked-example value (= 0.30 x 483 MPa = 144.9 MPa).
 *
 * # v1 scope (deliberately conservative — matches the common baseline calculators)
 * These are recorded here so the boundary is explicit, not accidental:
 * 1. **ASD only.** Allowable-stress design (0.30 x FEXX). LRFD (phi = 0.75,
 *    Fnw = 0.60 x FEXX) is deferred until demanded via a `method` parameter.
 * 2. **Longitudinal / conservative.** No directional strength increase. AISC allows
 *    up to 1.5x for transverse loading (Fw = 0.60 x FEXX x (1 + 0.5 sin^1.5 theta));
 *    omitting it is conservative and matches most basic calculators.
 * 3. **Weld metal only.** Base-metal (shear rupture) checks are the engineer's
 *    responsibility; a full design also verifies the connected material.
 * 4. **Equal-leg, 90-degree joint.** t = 0.707 x leg assumes an equal-leg fillet on a
 *    square (90-degree) joint. Unequal-leg / non-90-degree joints are deferred.
 *
 * Reference: AISC 360 (Steel Construction Manual), AWS D1.1 Structural Welding Code.
 *
 * @throws {RangeError} legSize or weldLength is not positive, weldCount < 1, or
 *   appliedLoad is negative
 */
export function weldStrength(input: WeldStrengthInput): WeldStrengthResult {
  const { legSize, weldLength, electrode, appliedLoad } = input;
  const weldCount = input.weldCount ?? 1;

  // Validation
  if (legSize <= 0) {
    throw new RangeError('legSize must be greater than 0');
  }
  if (weldLength <= 0) {
    throw new RangeError('weldLength must be greater than 0');
  }
  if (weldCount < 1) {
    throw new RangeError('weldCount must be at least 1');
  }
  if (appliedLoad < 0) {
    throw new RangeError('appliedLoad must not be negative');
  }

  const fexx = FEXX_MPA[electrode];

  // Geometry and capacity
  const throat = THROAT_FACTOR * legSize;                 // mm
  const effectiveArea = throat * weldLength * weldCount;  // mm^2
  const allowableShearStress = ASD_SHEAR_FACTOR * fexx;   // MPa
  const allowableLoad = allowableShearStress * effectiveArea; // N (MPa x mm^2)

  // Demand
  const actualStress = appliedLoad / effectiveArea;       // MPa
  const utilization = appliedLoad / allowableLoad;        // ratio

  // Smallest equal leg that carries appliedLoad (inverts throat + capacity):
  // leg_min = P / (Fw x 0.707 x L x n). Denominator is always > 0.
  const minRequiredLeg =
    appliedLoad / (allowableShearStress * THROAT_FACTOR * weldLength * weldCount);

  return {
    throat: roundTo(throat, 3),
    effectiveArea: roundTo(effectiveArea, 2),
    allowableShearStress: roundTo(allowableShearStress, 2),
    allowableLoad: roundTo(allowableLoad, 1),
    actualStress: roundTo(actualStress, 2),
    utilization: roundTo(utilization, 4),
    minRequiredLeg: roundTo(minRequiredLeg, 3),
    isSafe: utilization <= 1,
  };
}
