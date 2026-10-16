import { roundTo, requireFinite } from '../utils.js';
import type { TapInput, TapResult } from './types.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate tap drill size and thread dimensions.
 *
 * Geometry (ISO 68-1 basic profile, 60 degrees):
 * - Thread height H = 0.866025 x pitch (sqrt(3)/2 x p)
 * - Basic minor diameter of the internal thread = D - 2 x (5/8) x H = D - 1.0825 x p
 * - Pitch diameter = D - 0.6495 x p
 *
 * Percentage of thread (the tap drill chart convention):
 * - Tap drill = D - (%/100) x 1.299 x p, i.e. 100 % of thread is a diametral depth of
 *   1.299 x p (= 1.5 x H, twice the basic thread height of the external thread, 0.6495 p).
 * - So the common chart drill D - p is 100 / 1.299 = 76.98 % of thread, and 75 % is D - 0.974 p
 *   (M10 x 1.5 -> 8.54 mm).
 * - Above about 83 % the drill is smaller than the basic minor diameter: the percentage is a
 *   measure of thread engagement against the external thread, not of the internal profile.
 *
 * For Unified threads (UNC/UNF) the pitch is 25.4 / TPI and the same formulas apply.
 *
 * The 0.866025, 1.0825 and 1.299 factors are the geometry of the 60 degree profile, not chosen
 * constants. The thread percentage is a shop choice on top of that geometry: 75 % is the usual
 * default because it keeps most of the strength for much less tapping torque, but it is a
 * convention, and no standard prescribes it.
 *
 * @reference ISO 68-1, basic profile for ISO general purpose metric screw threads.
 * @reference Machinery's Handbook (20th ed., p. 1435): hole size for a percentage of thread,
 *   D - 1.299 x % / TPI.
 * @reference ISO 2306: tapping drill diameters approximately equal to the nominal diameter minus
 *   the pitch.
 */
export function tap(input: TapInput): TapResult {
  requireFinite('tap', input);
  const { standard, majorDiameter, pitch: inputPitch, threadPercentage = 75 } = input;

  // Validate inputs
  if (majorDiameter <= 0) {
    throw inputRangeError('majorDiameter must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'majorDiameter', exclusive_min: 0, got: majorDiameter,
    });
  }
  if (inputPitch <= 0) {
    throw inputRangeError('pitch must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'pitch', exclusive_min: 0, got: inputPitch,
    });
  }
  if (!(threadPercentage > 0 && threadPercentage <= 100)) {
    throw inputRangeError('threadPercentage must be greater than 0 and at most 100', {
      code: 'parameter_out_of_range', parameter: 'threadPercentage', exclusive_min: 0, max: 100, got: threadPercentage,
    });
  }

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
  // A pitch this coarse for the diameter (p ≥ D / 1.0825) leaves no core: the minor diameter and
  // the tap drill would come out zero or negative.
  if (!(D_minor_full > 0)) {
    // The bound in the caller's own unit: a metric pitch below D / 1.0825, or a TPI above 25.4 × 1.0825 / D.
    const coreFactor = 1.25 * 0.866025;
    throw inputRangeError('pitch is too coarse for the major diameter — the minor diameter would not be positive', standard === 'metric'
      ? { code: 'parameter_out_of_range', parameter: 'pitch', exclusive_max: majorDiameter / coreFactor, got: inputPitch }
      : { code: 'parameter_out_of_range', parameter: 'pitch', exclusive_min: (25.4 * coreFactor) / majorDiameter, got: inputPitch });
  }

  // Pitch diameter (at mid-height of thread)
  // D_pitch = D - 2 x (3H/8) = D - 0.75H = D - 0.6495p
  const D_pitch = majorDiameter - (0.75 * H);

  // Tap drill size for the desired percentage of thread: 100 % is a diametral depth of 1.5 H
  // (= 1.299 p) — the chart convention, under which D - p is 76.98 %.
  // A coarse pitch at a high percentage leaves no hole to drill: the percentage must stay below
  // 100 x D / (1.5 H), the depth that reaches the axis.
  const maxPercentage = (100 * majorDiameter) / (1.5 * H);
  if (!(threadPercentage < maxPercentage)) {
    throw inputRangeError('threadPercentage leaves no hole to drill for this diameter and pitch', {
      code: 'parameter_out_of_range', parameter: 'threadPercentage', exclusive_max: roundTo(maxPercentage, 2), got: threadPercentage,
    });
  }
  const tapDrillSize = majorDiameter - (threadPercentage / 100) * 1.5 * H;

  return {
    tapDrillSize: roundTo(tapDrillSize, 2),
    minorDiameter: roundTo(D_minor_full, 3),
    pitchDiameter: roundTo(D_pitch, 3),
    threadPercentage: roundTo(threadPercentage, 0),
    threadHeight: roundTo(H, 3),
  };
}
