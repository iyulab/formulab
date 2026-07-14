import { roundTo } from '../utils.js';
import type { LadderAngleInput, LadderAngleResult } from './types.js';

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

/**
 * OSHA 4:1 rule compliant setup-angle range, in degrees. The single source of truth
 * for the 70°/80° thresholds `ladderAngle()` checks `isCompliant` against — consumers
 * that draw the compliant band should import this rather than hardcoding the numbers.
 */
export const LADDER_COMPLIANT_ANGLE_RANGE = { min: 70, max: 80 } as const;

/**
 * Calculate ladder setup angle and OSHA compliance.
 *
 * OSHA 4:1 Rule: For every 4 feet of height, the base should be 1 foot out.
 * This gives an ideal angle of atan(4/1) ≈ 75.96° (commonly cited as 75.5°).
 * Compliant range: see {@link LADDER_COMPLIANT_ANGLE_RANGE} (70°–80°).
 *
 * Provide ladderLength and either height or baseDistance.
 * If both height and baseDistance are provided, ladderLength is recalculated.
 *
 * @param input - Ladder dimensions (2 of 3 required)
 * @returns Angle, compliance status, and warnings
 * @throws {RangeError} a provided height/baseDistance is negative, or ladderLength ≤ 0
 *   when it is used as a given (i.e. height and baseDistance are not both supplied).
 */
export function ladderAngle(input: LadderAngleInput): LadderAngleResult {
  let { ladderLength, height, baseDistance } = input;
  const warnings: string[] = [];

  if (height !== undefined && height < 0) {
    throw new RangeError('height must not be negative');
  }
  if (baseDistance !== undefined && baseDistance < 0) {
    throw new RangeError('baseDistance must not be negative');
  }
  // When both height and baseDistance are given, ladderLength is recalculated and
  // its input value (often a 0 placeholder) is ignored. Otherwise it is a given.
  const bothGiven = height !== undefined && baseDistance !== undefined;
  if (!bothGiven && ladderLength <= 0) {
    throw new RangeError('ladderLength must be greater than 0');
  }

  // Resolve the third dimension from the other two
  if (height !== undefined && baseDistance !== undefined) {
    // Both given: recalculate ladder length
    ladderLength = Math.sqrt(height * height + baseDistance * baseDistance);
  } else if (height !== undefined) {
    // height + ladderLength → baseDistance
    if (ladderLength <= height) {
      baseDistance = 0;
      warnings.push('Ladder length must be greater than height');
    } else {
      baseDistance = Math.sqrt(ladderLength * ladderLength - height * height);
    }
  } else if (baseDistance !== undefined) {
    // baseDistance + ladderLength → height
    if (ladderLength <= baseDistance) {
      height = 0;
      warnings.push('Ladder length must be greater than base distance');
    } else {
      height = Math.sqrt(ladderLength * ladderLength - baseDistance * baseDistance);
    }
  } else {
    // Neither height nor baseDistance → assume OSHA ideal angle (75.5°)
    height = ladderLength * Math.sin(75.5 * RAD);
    baseDistance = ladderLength * Math.cos(75.5 * RAD);
  }

  // Calculate angle from horizontal
  let angle = 0;
  if (baseDistance !== undefined && baseDistance > 0 && height !== undefined) {
    angle = Math.atan(height / baseDistance) * DEG;
  } else if (height !== undefined && height > 0) {
    angle = 90;
  }

  // Ideal base distance for OSHA 4:1 at given height
  const idealBaseDistance = height !== undefined ? height / 4 : 0;

  // Reach height = wall contact height + ~1m (3 feet) above contact point
  const reachHeight = (height ?? 0) + 1.0;

  // OSHA compliance: see LADDER_COMPLIANT_ANGLE_RANGE
  const isCompliant =
    angle >= LADDER_COMPLIANT_ANGLE_RANGE.min && angle <= LADDER_COMPLIANT_ANGLE_RANGE.max;

  // Generate warnings
  if (angle < LADDER_COMPLIANT_ANGLE_RANGE.min) {
    warnings.push('Angle too shallow (< 70°): ladder may slide out at base');
  } else if (angle > LADDER_COMPLIANT_ANGLE_RANGE.max) {
    warnings.push('Angle too steep (> 80°): ladder may tip backwards');
  }

  if (ladderLength > 0 && (height ?? 0) > 0) {
    if (isCompliant && (height ?? 0) > ladderLength * 0.97) {
      warnings.push('Ladder may not extend sufficiently above landing surface');
    }
  }

  return {
    angle: roundTo(angle, 4),
    height: roundTo(height ?? 0, 4),
    baseDistance: roundTo(baseDistance ?? 0, 4),
    ladderLength: roundTo(ladderLength, 4),
    idealBaseDistance: roundTo(idealBaseDistance, 4),
    reachHeight: roundTo(reachHeight, 4),
    isCompliant,
    warnings,
  };
}
