import { roundTo } from '../utils.js';
import type { FallClearanceInput, FallClearanceResult } from './types.js';

/** OSHA 29 CFR 1926.502(d)(16)(iii) — a personal fall arrest system must limit free fall to 6 ft. */
const MAX_FREE_FALL = 6 * 0.3048; // m — the rule is written in feet; 1.8 m is its rounded metric
/** OSHA 29 CFR 1926.502(d)(16)(iv) — deceleration distance must not exceed 3.5 ft. */
const MAX_DECELERATION = 3.5 * 0.3048; // m

/**
 * Fall clearance for a personal fall arrest system on a fixed-length shock-absorbing lanyard.
 *
 * Every height is measured from the worker's feet on the working surface, the way the anchor is
 * located on site. After arrest the D-ring hangs lanyard + deceleration + harness stretch below the
 * anchor and the feet a further D-ring height below that.
 *
 * @formula
 *   - Clearance below anchor = L + DD + HS + H_D + SF — the "18.5 ft" figure for a 6 ft lanyard
 *   - Total fall distance (feet travel) = L + DD + HS + H_D − A
 *   - Required clearance below the working surface = total fall distance + SF
 *   - Free fall = max(0, L + H_D − A) — the lanyard pays out before the absorber engages
 *   - With a working height W above the lower level: clearance above obstacle =
 *     W − obstacle height − required clearance, and the system is adequate when it is ≥ 0
 *
 *   (L lanyard, DD deceleration distance, HS harness stretch/D-ring shift, H_D D-ring height above
 *   the feet, A anchor height above the feet, SF safety factor)
 *
 * @reference OSHA 29 CFR 1926.502(d)(16)(iii)–(iv) — free fall ≤ 1.8 m (6 ft), deceleration ≤ 1.07 m
 *   (3.5 ft), and the employee must not contact any lower level
 * @reference ANSI/ASSP Z359 fall-arrest clearance practice
 * @validation Clearance below anchor for a 6 ft lanyard, 3.5 ft deceleration, 1 ft harness stretch,
 *   5 ft D-ring height and 3 ft safety factor = 18.5 ft (the widely published manufacturer and
 *   ARTBA worked figure)
 *
 * @throws {RangeError} dRingHeight ≤ 0, or lanyardLength, decelerationDistance, harnessStretch,
 *   safetyFactor, workingHeight or obstacleHeight is negative
 * @remarks anchorAboveFeet may be negative (an anchor below the feet); the free-fall warning reports it.
 */
export function fallClearance(input: FallClearanceInput): FallClearanceResult {
  const {
    lanyardLength: L,
    decelerationDistance: DD,
    harnessStretch: HS,
    dRingHeight: HD,
    anchorAboveFeet: A,
    safetyFactor: SF,
    workingHeight,
    obstacleHeight = 0,
  } = input;

  if (HD <= 0) throw new RangeError('dRingHeight must be greater than 0');
  if (L < 0 || DD < 0 || HS < 0 || SF < 0 || obstacleHeight < 0 || (workingHeight !== undefined && workingHeight < 0)) {
    throw new RangeError('lanyardLength, decelerationDistance, harnessStretch, safetyFactor, workingHeight and obstacleHeight must not be negative');
  }

  const clearanceBelowAnchor = L + DD + HS + HD + SF;
  const totalFallDistance = L + DD + HS + HD - A;
  const requiredClearance = totalFallDistance + SF;
  const freeFallDistance = Math.max(0, L + HD - A);

  // Judged on the reported (rounded) margin so the verdict and the number shown next to it agree.
  const clearanceAboveObstacle =
    workingHeight === undefined ? null : roundTo(workingHeight - obstacleHeight - requiredClearance, 3);
  const isAdequate = clearanceAboveObstacle === null ? null : clearanceAboveObstacle >= 0;

  const warnings: string[] = [];
  if (freeFallDistance > MAX_FREE_FALL) {
    warnings.push(`Free fall of ${freeFallDistance.toFixed(2)} m exceeds the OSHA limit of 1.8 m (6 ft) — raise the anchor or shorten the lanyard`);
  }
  if (DD > MAX_DECELERATION) {
    warnings.push('Deceleration distance exceeds the OSHA limit of 1.07 m (3.5 ft)');
  }
  if (clearanceAboveObstacle !== null && clearanceAboveObstacle < 0) {
    warnings.push(`Insufficient clearance: ${Math.abs(clearanceAboveObstacle).toFixed(2)} m short of the required clearance above the obstacle`);
  }

  return {
    totalFallDistance: roundTo(totalFallDistance, 3),
    requiredClearance: roundTo(requiredClearance, 3),
    clearanceBelowAnchor: roundTo(clearanceBelowAnchor, 3),
    freeFallDistance: roundTo(freeFallDistance, 3),
    clearanceAboveObstacle,
    isAdequate,
    warnings,
  };
}
