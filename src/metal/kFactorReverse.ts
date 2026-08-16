import { propagate } from '../math.js';
import type { KFactorReverseInput, KFactorReverseResult, KFactorReverseRangeResult } from './types.js';

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
 */
export function kFactorReverse(input: KFactorReverseInput): KFactorReverseResult {
  const {
    thickness,
    bendAngle,
    insideRadius,
    measuredFlatLength,
    legA,
    legB,
  } = input;

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
