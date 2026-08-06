import { roundTo } from '../utils.js';
import type { TapInput, TapResult } from './types.js';

/**
 * Calculate tap drill size and thread dimensions.
 *
 * For metric threads (ISO):
 * - Thread height H = 0.866025 x pitch (sqrt(3)/2 x p)
 * - Minor diameter = Major diameter - 2 x (5/8) x H = D - 1.0825 x p
 * - Tap drill for 75% thread = Major diameter - pitch
 * - General formula: Tap drill = D - (2 x H x %/100)
 *
 * For Unified threads (UNC/UNF):
 * - Convert TPI to pitch: p = 25.4 / TPI
 * - Same formulas apply
 *
 * The 0.866025 and 1.0825 factors are the geometry of the 60 degree basic profile, not
 * chosen constants. The thread percentage is a shop choice on top of that geometry: 75%
 * is the usual default because it keeps most of the strength for much less tapping
 * torque, but it is a convention, and no standard prescribes it.
 *
 * @reference ISO 68-1, basic profile for ISO general purpose metric screw threads.
 */
export function tap(input: TapInput): TapResult {
  const { standard, majorDiameter, pitch: inputPitch, threadPercentage = 75 } = input;

  // Validate inputs
  if (majorDiameter <= 0) throw new RangeError('majorDiameter must be greater than 0');
  if (inputPitch <= 0) throw new RangeError('pitch must be greater than 0');

  // Convert TPI to metric pitch for unified threads
  const pitch = standard === 'metric' ? inputPitch : 25.4 / inputPitch;

  // Thread height (theoretical sharp V-thread)
  // H = (sqrt(3)/2) x p = 0.866025 x p
  const H = 0.866025 * pitch;

  // For ISO metric threads:
  // Fundamental triangle height H
  // Internal thread minor diameter = D - 2 x (5H/8) = D - 1.25H = D - 1.0825p
  // But for tap drill calculation, we use the desired thread percentage

  // Minor diameter (at the root of internal thread)
  // D_minor = D - 2 x (5H/8) for 100% thread
  const D_minor_full = majorDiameter - (1.25 * H);

  // Pitch diameter (at mid-height of thread)
  // D_pitch = D - 2 x (3H/8) = D - 0.75H = D - 0.6495p
  const D_pitch = majorDiameter - (0.75 * H);

  // Tap drill size for desired thread percentage
  // Thread depth for X% = (X/100) x (5H/8) per side
  // Tap drill = D - 2 x (X/100) x (5H/8)
  // Simplified: Tap drill = D - (X/100) x 1.25H
  //
  // For 75% thread: Tap drill ≈ D - p (common approximation)
  // More precise: Tap drill = D - 0.75 x 1.25H = D - 0.9375H

  const threadEngagementFactor = threadPercentage / 100;
  const tapDrillSize = majorDiameter - (threadEngagementFactor * 1.25 * H);

  return {
    tapDrillSize: roundTo(tapDrillSize, 2),
    minorDiameter: roundTo(D_minor_full, 3),
    pitchDiameter: roundTo(D_pitch, 3),
    threadPercentage: roundTo(threadPercentage, 0),
    threadHeight: roundTo(H, 3),
  };
}
