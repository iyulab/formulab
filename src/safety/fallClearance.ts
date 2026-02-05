import type { FallClearanceInput, FallClearanceResult } from './types.js';

/**
 * Calculate fall clearance requirements for personal fall protection systems.
 *
 * Total Fall Distance = Lanyard Length + Deceleration Distance + Harness Stretch + Worker Height + Safety Factor
 * Minimum Height = Total Fall Distance - Anchor Height
 *
 * @param input - Fall clearance parameters
 * @returns Fall clearance results including total fall distance and minimum height
 */
export function fallClearance(input: FallClearanceInput): FallClearanceResult {
  const {
    lanyardLength,
    decelerationDistance,
    harnessStretch,
    workerHeight,
    safetyFactor,
    anchorHeight,
  } = input;

  // Calculate total fall distance (all components that contribute to the fall)
  const totalFallDistance =
    lanyardLength +
    decelerationDistance +
    harnessStretch +
    workerHeight +
    safetyFactor;

  // Minimum height is total fall distance minus anchor height above feet
  const minimumHeight = totalFallDistance - anchorHeight;

  // Determine if the system is adequate
  // isAdequate is true if anchor is elevated enough to reduce risk
  // isAdequate is false if anchor is at foot level or below (no reduction)
  // isAdequate is null if cannot be determined (edge cases)
  let isAdequate: boolean | null = null;
  if (anchorHeight > 0) {
    isAdequate = true;
  } else if (anchorHeight <= 0) {
    isAdequate = false;
  }

  return {
    totalFallDistance,
    minimumHeight,
    isAdequate,
  };
}
