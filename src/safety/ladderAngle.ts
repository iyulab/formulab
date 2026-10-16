import { roundTo, requireFinite } from '../utils.js';
import type { LadderAngleInput, LadderAngleResult } from './types.js';
import { inputRangeError } from '../errors.js';
import { Notes } from '../diagnostics.js';

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
 * OSHA 4:1 rule, 29 CFR 1926.1053(b)(5)(i): the foot of the ladder sits one quarter of its working
 * length (foot to top support) out from the support, so cos θ = 1/4 and θ ≈ 75.5°.
 * (A quarter of the *height* instead gives atan(4) ≈ 75.96°.)
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
  requireFinite('ladderAngle', input);
  let { ladderLength, height, baseDistance } = input;
  const notes = new Notes();

  if (height !== undefined && height < 0) {
    throw inputRangeError('height must not be negative', {
      code: 'parameter_out_of_range', parameter: 'height', min: 0, got: height,
    });
  }
  if (baseDistance !== undefined && baseDistance < 0) {
    throw inputRangeError('baseDistance must not be negative', {
      code: 'parameter_out_of_range', parameter: 'baseDistance', min: 0, got: baseDistance,
    });
  }
  // When both height and baseDistance are given, ladderLength is recalculated and
  // its input value (often a 0 placeholder) is ignored. Otherwise it is a given.
  const bothGiven = height !== undefined && baseDistance !== undefined;
  if (!bothGiven && ladderLength <= 0) {
    throw inputRangeError('ladderLength must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'ladderLength', exclusive_min: 0, got: ladderLength,
    });
  }

  // Resolve the third dimension from the other two
  if (height !== undefined && baseDistance !== undefined) {
    // Both given: recalculate ladder length
    ladderLength = Math.sqrt(height * height + baseDistance * baseDistance);
  } else if (height !== undefined) {
    // height + ladderLength → baseDistance
    if (ladderLength < height) {
      throw inputRangeError('ladderLength must not be shorter than height', {
        code: 'parameter_out_of_range', parameter: 'ladderLength', min: height, got: ladderLength,
      });
    }
    if (ladderLength === height) {
      baseDistance = 0;
      notes.add('Ladder length must be greater than height', {
        code: 'ladder_too_short', parameter: 'height', got: ladderLength,
      });
    } else {
      baseDistance = Math.sqrt(ladderLength * ladderLength - height * height);
    }
  } else if (baseDistance !== undefined) {
    // baseDistance + ladderLength → height
    if (ladderLength < baseDistance) {
      throw inputRangeError('ladderLength must not be shorter than baseDistance', {
        code: 'parameter_out_of_range', parameter: 'ladderLength', min: baseDistance, got: ladderLength,
      });
    }
    if (ladderLength === baseDistance) {
      height = 0;
      notes.add('Ladder length must be greater than base distance', {
        code: 'ladder_too_short', parameter: 'baseDistance', got: ladderLength,
      });
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

  // Ideal base distance: one quarter of the working length, OSHA 29 CFR 1926.1053(b)(5)(i). This is
  // the same rule as the 75.5° default above (cos 75.5° ≈ 1/4); a quarter of the *height* would be
  // atan(4) ≈ 75.96°, a different ladder.
  const idealBaseDistance = ladderLength / 4;

  // Reach height = wall contact height + ~1m (3 feet) above contact point
  const reachHeight = (height ?? 0) + 1.0;

  // OSHA compliance: see LADDER_COMPLIANT_ANGLE_RANGE
  const isCompliant =
    angle >= LADDER_COMPLIANT_ANGLE_RANGE.min && angle <= LADDER_COMPLIANT_ANGLE_RANGE.max;

  // Generate warnings
  if (angle < LADDER_COMPLIANT_ANGLE_RANGE.min) {
    notes.add('Angle too shallow (< 70°): ladder may slide out at base', {
      code: 'ladder_angle_too_shallow', parameter: 'angle', got: roundTo(angle, 2), min: LADDER_COMPLIANT_ANGLE_RANGE.min,
    });
  } else if (angle > LADDER_COMPLIANT_ANGLE_RANGE.max) {
    notes.add('Angle too steep (> 80°): ladder may tip backwards', {
      code: 'ladder_angle_too_steep', parameter: 'angle', got: roundTo(angle, 2), max: LADDER_COMPLIANT_ANGLE_RANGE.max,
    });
  }

  if (ladderLength > 0 && (height ?? 0) > 0) {
    if (isCompliant && (height ?? 0) > ladderLength * 0.97) {
      notes.add('Ladder may not extend sufficiently above landing surface', { code: 'ladder_extension_short' });
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
    warnings: notes.warnings,
    diagnostics: notes.diagnostics,
  };
}
