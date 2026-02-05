import type { KFactorReverseInput, KFactorReverseResult } from './types.js';

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
