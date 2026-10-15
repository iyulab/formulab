import { propagate } from '../math.js';
import type { KFactorReverseInput, KFactorReverseResult, KFactorReverseRangeResult } from './types.js';
import { requireFinite } from '../utils.js';
import { InputRangeError } from '../errors.js';

/**
 * Reverse calculate K-factor from measured flat length.
 *
 * Given the measured flat length and leg dimensions, derive the K-factor
 * that would produce that flat length.
 *
 * Process:
 * 1. Calculate bend deduction: BD = legA + legB - measuredFlatLength
 * 2. Calculate OSSB: OSSB = (insideRadius + thickness) x tan(angle/2)
 * 3. Calculate BA: BA = 2 x OSSB - BD
 * 4. Solve for K: BA = angleRad x (insideRadius + K x thickness)
 *    => K = (BA / angleRad - insideRadius) / thickness
 *
 * @param input - K-factor reverse input parameters
 * @returns KFactorReverseResult with calculated K-factor
 * @throws RangeError if thickness ≤ 0, bendAngle is not strictly between 0 and 180, insideRadius < 0, or the
 *   measurements imply a K-factor outside [0, 1] — the neutral axis lies inside the material, so such a K
 *   means the measured flat length does not belong to this bend (a 95° bend measured as a 90° one gave −0.62)
 */
export function kFactorReverse(input: KFactorReverseInput): KFactorReverseResult {
  requireFinite('kFactorReverse', input);
  const {
    thickness,
    bendAngle,
    insideRadius,
    measuredFlatLength,
    legA,
    legB,
  } = input;

  // The K-factor divides by the bend angle in radians and again by the thickness, so a
  // zero in either place yields an infinite K rather than a sheet that cannot be bent.
  if (!(thickness > 0)) {
    throw new InputRangeError('thickness must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'thickness', exclusive_min: 0, got: thickness,
    });
  }
  if (!(bendAngle > 0) || bendAngle >= 180) {
    throw new InputRangeError('bendAngle must be greater than 0 and less than 180', {
      code: 'parameter_out_of_range', parameter: 'bendAngle', exclusive_min: 0, exclusive_max: 180, got: bendAngle,
    });
  }
  if (!(insideRadius >= 0)) {
    throw new InputRangeError('insideRadius must not be negative', {
      code: 'parameter_out_of_range', parameter: 'insideRadius', min: 0, got: insideRadius,
    });
  }

  // Convert bend angle to radians
  const bendAngleRad = (bendAngle * Math.PI) / 180;

  // Calculate bend deduction from measured data
  // For L-shape: measuredFlatLength = legA + legB - BD
  // => BD = legA + legB - measuredFlatLength
  const bd = legA + legB - measuredFlatLength;

  // Calculate Outside Setback (OSSB)
  const halfAngleRad = bendAngleRad / 2;
  const ossb = (insideRadius + thickness) * Math.tan(halfAngleRad);

  // Calculate Bend Allowance from BD and OSSB
  // BD = 2 x OSSB - BA => BA = 2 x OSSB - BD
  const ba = 2 * ossb - bd;

  // Solve for K-factor from BA formula
  // BA = angleRad x (insideRadius + K x thickness)
  // => K = (BA / angleRad - insideRadius) / thickness
  const kFactor = (ba / bendAngleRad - insideRadius) / thickness;
  if (!(kFactor >= 0 && kFactor <= 1)) {
    throw new RangeError(
      `the measured flat length does not fit this bend: it implies a K-factor of ${kFactor.toFixed(3)}, outside [0, 1]`,
    );
  }

  return {
    kFactor,
  };
}

/**
 * K-factor reverse calculation with a defensible range, derived from
 * measurement uncertainty on the physically-measured inputs rather than
 * from the K-factor table's own unsourced defaults (see `bendAllowance`'s
 * `K_FACTOR_TABLE` doc comment -- that table has no range to propagate,
 * because it has no source at all). `thickness` and `bendAngle` are
 * treated as exact: they are typically nominal/design values the caller
 * already knows, not measured on the physical part.
 *
 * Uses corner-case interval propagation (`propagate`, `../math.js`), not
 * Monte Carlo -- an engineer wants a range, not a distribution.
 *
 * @param input - same as `kFactorReverse`
 * @param measurementUncertaintyMm - +/- half-width applied to
 *   `measuredFlatLength`, `legA`, `legB`, `insideRadius`. Default 0.02 mm
 *   matches the accuracy commonly specified for a shop-grade digital
 *   caliper (e.g. Mitutoyo 500-series, +/-0.02 mm across the measuring
 *   range) -- a property of the instrument the caller states they used,
 *   not of this formula. Pass a different value for a different
 *   instrument (a dial or vernier caliper is typically +/-0.03 mm or
 *   looser).
 */
export function kFactorReverseRange(
  input: KFactorReverseInput,
  measurementUncertaintyMm = 0.02,
): KFactorReverseRangeResult {
  requireFinite('kFactorReverseRange', input);
  requireFinite('kFactorReverseRange', { measurementUncertaintyMm });
  const { value, min, max } = propagate(
    input,
    {
      measuredFlatLength: measurementUncertaintyMm,
      legA: measurementUncertaintyMm,
      legB: measurementUncertaintyMm,
      insideRadius: measurementUncertaintyMm,
    },
    kFactorReverse,
    (result) => result.kFactor,
  );
  return { kFactor: value, kFactorMin: min, kFactorMax: max };
}
