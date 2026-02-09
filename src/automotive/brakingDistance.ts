import { roundTo } from '../utils.js';
import type { BrakingDistanceInput, BrakingDistanceResult } from './types.js';

/**
 * Braking Distance Calculator (AASHTO method)
 *
 * Calculates stopping distance based on:
 * - Reaction distance: d_r = v × t_reaction
 * - Braking distance: d_b = v² / (2 × g × (f ± G))
 *   where G = grade/100 (positive uphill, negative downhill)
 *
 * Reference: AASHTO "A Policy on Geometric Design of Highways and Streets"
 *
 * @throws {RangeError} Speed must be positive
 * @throws {RangeError} Friction coefficient must be positive
 * @throws {RangeError} Reaction time must be non-negative
 * @throws {RangeError} Effective friction (friction + grade) must be positive — vehicle cannot stop on this grade
 * @param input - speed, friction, reaction time, grade
 * @returns stopping distance components
 */
export function brakingDistance(input: BrakingDistanceInput): BrakingDistanceResult {
  const { speed, friction, reactionTime, grade } = input;

  if (speed <= 0) throw new RangeError('Speed must be positive');
  if (friction <= 0) throw new RangeError('Friction coefficient must be positive');
  if (reactionTime < 0) throw new RangeError('Reaction time must be non-negative');

  const g = 9.81; // m/s²
  const speedMps = speed / 3.6; // km/h → m/s
  const gradeDecimal = grade / 100; // % → decimal

  // Reaction distance: d = v × t
  const reactionDist = speedMps * reactionTime;

  // Effective friction considering grade
  // Uphill (positive grade) helps braking, downhill (negative) hinders
  const effectiveFriction = friction + gradeDecimal;

  if (effectiveFriction <= 0) {
    throw new RangeError('Effective friction (friction + grade) must be positive — vehicle cannot stop on this grade');
  }

  // Deceleration: a = g × (f ± G)
  const deceleration = g * effectiveFriction;

  // Braking distance: d = v² / (2 × a)
  const brakingDist = (speedMps * speedMps) / (2 * deceleration);

  const totalStoppingDistance = reactionDist + brakingDist;

  return {
    reactionDistance: roundTo(reactionDist, 2),
    brakingDistance: roundTo(brakingDist, 2),
    totalStoppingDistance: roundTo(totalStoppingDistance, 2),
    speedMps: roundTo(speedMps, 2),
    deceleration: roundTo(deceleration, 2),
  };
}
