import { roundTo } from '../utils.js';
import type {
  ColumnEndCondition,
  ColumnBucklingInput,
  ColumnBucklingResult,
} from './types.js';

/**
 * Effective-length factor K for idealized end conditions (AISC theoretical values,
 * Steel Construction Manual Table C-A-7.1). These are the ideal K, not the higher
 * recommended design values that account for real joint fixity — see v1 scope.
 */
const K_FACTOR: Record<ColumnEndCondition, number> = {
  'pinned-pinned': 1.0,
  'fixed-fixed': 0.5,
  'fixed-free': 2.0,
  'fixed-pinned': 0.7, // theoretical 0.699..., rounded to the standard 0.7
};

/**
 * Euler elastic critical buckling load of a straight, prismatic, axially loaded column.
 *
 * # Formulas
 * - Effective length:     Le = K x L
 * - Critical load (Euler): Pcr = pi^2 x E x I / Le^2
 * - Radius of gyration:   r = sqrt(I / A)
 * - Slenderness ratio:    lambda = Le / r
 * - Critical stress:      sigma_cr = Pcr / A
 * - Transition slenderness (elastic/inelastic boundary, where Euler stress = sigma_y / 2):
 *                         Cc = pi x sqrt(2 E / sigma_y)
 * - Squash (yield) load:  Py = A x sigma_y
 *
 * Units are SI: E in MPa (= N/mm^2), I in mm^4, A in mm^2, L in mm → Pcr in N, sigma in MPa.
 *
 * # The slenderness validity guard (why this matters)
 * The Euler formula is only physically valid for **slender (long) columns** that buckle
 * elastically before the material yields — i.e. lambda >= Cc. For **short/stubby columns**
 * (lambda < Cc) inelastic (Johnson) buckling or plain squashing governs, and raw Euler
 * **over-predicts the capacity, sometimes enormously** (as lambda → 0, Pcr → infinity).
 * This function does NOT clamp Pcr — it returns the honest Euler value plus `isElastic`,
 * so a consumer can flag "short column: Euler over-predicts, inelastic buckling governs"
 * instead of silently drawing a capacity the column cannot reach. `yieldLoad` (Py = A·σy)
 * is returned as the reference ceiling for that case.
 *
 * # v1 scope (deliberately simple — matches common baseline calculators)
 * 1. **Elastic Euler only.** Inelastic / Johnson buckling is flagged via `isElastic`,
 *    not computed. A dedicated inelastic Fcr is deferred until demanded.
 * 2. **Idealized (theoretical) K.** Recommended design K that account for real joint
 *    fixity (e.g. fixed-fixed 0.65) are deferred.
 * 3. **Concentric axial load, initially straight, prismatic (constant EI) member.**
 *
 * Reference: AISC 360 Chapter E; Euler (1744); any mechanics-of-materials text.
 *
 * @throws {RangeError} youngsModulus, momentOfInertia, area, length, or yieldStrength
 *   is not positive
 */
export function columnBuckling(input: ColumnBucklingInput): ColumnBucklingResult {
  const { youngsModulus, momentOfInertia, area, length, endCondition, yieldStrength } = input;

  if (youngsModulus <= 0) {
    throw new RangeError('youngsModulus must be greater than 0');
  }
  if (momentOfInertia <= 0) {
    throw new RangeError('momentOfInertia must be greater than 0');
  }
  if (area <= 0) {
    throw new RangeError('area must be greater than 0');
  }
  if (length <= 0) {
    throw new RangeError('length must be greater than 0');
  }
  if (yieldStrength <= 0) {
    throw new RangeError('yieldStrength must be greater than 0');
  }

  const k = K_FACTOR[endCondition];
  const effectiveLength = k * length;                                   // mm

  const criticalLoad = (Math.PI ** 2 * youngsModulus * momentOfInertia) / effectiveLength ** 2; // N
  const radiusOfGyration = Math.sqrt(momentOfInertia / area);           // mm
  const slendernessRatio = effectiveLength / radiusOfGyration;          // dimensionless
  const criticalStress = criticalLoad / area;                          // MPa
  const transitionSlenderness = Math.PI * Math.sqrt((2 * youngsModulus) / yieldStrength);
  const yieldLoad = area * yieldStrength;                              // N

  return {
    effectiveLengthFactor: k,
    effectiveLength: roundTo(effectiveLength, 2),
    criticalLoad: roundTo(criticalLoad, 1),
    criticalStress: roundTo(criticalStress, 2),
    radiusOfGyration: roundTo(radiusOfGyration, 3),
    slendernessRatio: roundTo(slendernessRatio, 2),
    transitionSlenderness: roundTo(transitionSlenderness, 2),
    yieldLoad: roundTo(yieldLoad, 1),
    isElastic: slendernessRatio >= transitionSlenderness,
  };
}
