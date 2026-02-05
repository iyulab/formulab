import type { FallClearanceInput, FallClearanceResult } from './types.js';

/**
 * Calculate fall clearance requirements for personal fall protection systems.
 * Implements ANSI Z359.1 and Z359.4 guidelines.
 *
 * Total Fall Distance = Lanyard Length + Deceleration Distance + Harness Stretch + Worker Height
 * Free Space Required = Total Fall Distance + Safety Factor + Rescue Clearance - Anchor Height
 * Clearance Above Obstacle = Anchor Height - (Total Fall Distance + Safety Factor) - Obstacle Height
 *
 * ANSI Z359 Components:
 * - Lanyard/SRL length: typically 1.8m (6ft)
 * - Deceleration distance: max 1.07m (3.5ft) per OSHA
 * - Harness stretch: ~0.3m (1ft)
 * - D-ring to feet: ~1.5m (5ft)
 * - Rescue clearance: 0.9m (3ft) minimum per ANSI Z359.4
 *
 * @param input - Fall clearance parameters
 * @returns Fall clearance results including adequacy assessment and warnings
 */
export function fallClearance(input: FallClearanceInput): FallClearanceResult {
  const {
    lanyardLength,
    decelerationDistance,
    harnessStretch,
    workerHeight,
    safetyFactor,
    anchorHeight,
    rescueClearance = 0.9, // ANSI Z359.4 default minimum
    obstacleHeight = 0,    // Ground level default
  } = input;

  const warnings: string[] = [];

  // Validate inputs and generate warnings
  if (lanyardLength > 1.8) {
    warnings.push('Lanyard exceeds standard 1.8m (6ft) length');
  }
  if (decelerationDistance > 1.07) {
    warnings.push('Deceleration distance exceeds OSHA maximum of 1.07m (3.5ft)');
  }
  if (workerHeight < 1.2 || workerHeight > 2.0) {
    warnings.push('Worker height outside typical range (1.2-2.0m)');
  }
  if (safetyFactor < 0.6) {
    warnings.push('Safety factor below recommended minimum (0.6m/2ft)');
  }
  if (rescueClearance < 0.9) {
    warnings.push('Rescue clearance below ANSI Z359.4 minimum (0.9m/3ft)');
  }

  // Calculate total fall distance (before arrest)
  // This is the distance worker falls before deceleration device fully activates
  const totalFallDistance =
    lanyardLength +
    decelerationDistance +
    harnessStretch +
    workerHeight;

  // Calculate minimum height requirement
  // This is the minimum anchor height needed to prevent ground contact
  const minimumHeight = totalFallDistance + safetyFactor - anchorHeight;

  // Calculate total free space required below anchor
  // Includes rescue clearance for post-fall positioning
  const freeSpaceRequired = totalFallDistance + safetyFactor + rescueClearance;

  // Calculate clearance above obstacle
  // Positive = safe clearance exists
  // Negative = worker would contact obstacle
  const workerLowestPoint = anchorHeight - (totalFallDistance + safetyFactor);
  const clearanceAboveObstacle = workerLowestPoint - obstacleHeight;

  // Determine if the system is adequate
  let isAdequate: boolean | null = null;

  if (anchorHeight <= 0) {
    // Anchor at or below feet level - extremely dangerous
    isAdequate = false;
    warnings.push('Anchor at or below foot level - fall protection inadequate');
  } else if (clearanceAboveObstacle < 0) {
    // Worker would contact obstacle
    isAdequate = false;
    warnings.push(`Insufficient clearance: worker would be ${Math.abs(clearanceAboveObstacle).toFixed(2)}m below obstacle level`);
  } else if (clearanceAboveObstacle < rescueClearance) {
    // Clearance exists but rescue may be difficult
    isAdequate = true;
    warnings.push('Limited clearance for rescue operations');
  } else {
    // Adequate clearance for fall arrest and rescue
    isAdequate = true;
  }

  // Additional warning for marginal situations
  if (isAdequate && clearanceAboveObstacle < 1.5) {
    warnings.push('Consider increasing anchor height for additional safety margin');
  }

  return {
    totalFallDistance: Math.round(totalFallDistance * 1000) / 1000,
    minimumHeight: Math.round(minimumHeight * 1000) / 1000,
    rescueClearance,
    freeSpaceRequired: Math.round(freeSpaceRequired * 1000) / 1000,
    clearanceAboveObstacle: Math.round(clearanceAboveObstacle * 1000) / 1000,
    isAdequate,
    warnings,
  };
}
