import { roundTo, requireFinite } from '../utils.js';
import type { GearInput, GearResult } from './types.js';

// Standard pressure angle for spur gears (degrees)
const PRESSURE_ANGLE_DEG = 20;
const PRESSURE_ANGLE_RAD = (PRESSURE_ANGLE_DEG * Math.PI) / 180;

/**
 * Calculate gear geometry based on module system.
 *
 * Module: m = d / z (pitch diameter / number of teeth)
 * Center distance: a = (z1 + z2) x m / 2
 * Addendum: ha = m
 * Dedendum: hf = 1.25 x m
 * Circular pitch: p = pi x m
 * Base circle diameter: db = d x cos(pressure angle)
 *
 * @reference ISO 21771 — Gears — Cylindrical involute gears and gear pairs — Concepts and geometry
 * @throws {RangeError} fromModule: module or teethGear1 missing or not greater than 0, or a given
 *   teethGear2 not greater than 0; fromPitchDiameter: pitchDiameter or numberOfTeeth missing or not
 *   greater than 0
 */
export function gear(input: GearInput): GearResult {
  requireFinite('gear', input);
  const { mode } = input;

  let module: number;
  let z1: number;
  let z2: number | undefined;

  // A missing or non-positive module, pitch diameter or tooth count has no gear to describe; the
  // former all-zero result read as a 0 mm gear.
  if (mode === 'fromModule') {
    if (!(input.module !== undefined && input.module > 0)) {
      throw new RangeError('module must be greater than 0');
    }
    if (!(input.teethGear1 !== undefined && input.teethGear1 > 0)) {
      throw new RangeError('teethGear1 must be greater than 0');
    }
    if (input.teethGear2 !== undefined && !(input.teethGear2 > 0)) {
      throw new RangeError('teethGear2 must be greater than 0 when given');
    }
    module = input.module;
    z1 = input.teethGear1;
    z2 = input.teethGear2;
  } else {
    if (!(input.pitchDiameter !== undefined && input.pitchDiameter > 0)) {
      throw new RangeError('pitchDiameter must be greater than 0');
    }
    if (!(input.numberOfTeeth !== undefined && input.numberOfTeeth > 0)) {
      throw new RangeError('numberOfTeeth must be greater than 0');
    }
    module = input.pitchDiameter / input.numberOfTeeth;
    z1 = input.numberOfTeeth;
    z2 = undefined;
  }

  // Pitch diameters
  const d1 = module * z1;
  const d2 = z2 !== undefined ? module * z2 : undefined;

  // Center distance (only if both gears specified)
  const centerDistance = z2 !== undefined ? ((z1 + z2) * module) / 2 : undefined;

  // Standard gear tooth dimensions
  const addendum = module;           // ha = 1.0 x m
  const dedendum = 1.25 * module;    // hf = 1.25 x m
  const circularPitch = Math.PI * module; // p = pi x m

  // Base circle diameter (for involute profile)
  const baseCircleDiameter1 = d1 * Math.cos(PRESSURE_ANGLE_RAD);

  const result: GearResult = {
    module: roundTo(module, 3),
    pitchDiameter1: roundTo(d1, 3),
    addendum: roundTo(addendum, 3),
    dedendum: roundTo(dedendum, 3),
    circularPitch: roundTo(circularPitch, 3),
    baseCircleDiameter1: roundTo(baseCircleDiameter1, 3),
  };

  if (d2 !== undefined) {
    result.pitchDiameter2 = roundTo(d2, 3);
  }

  if (centerDistance !== undefined) {
    result.centerDistance = roundTo(centerDistance, 3);
  }

  return result;
}
