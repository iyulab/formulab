import type { ReactorInput, ReactorResult } from './types.js';
import { roundTo, requireFinite } from '../utils.js';
import { inputRangeError } from '../errors.js';

/**
 * Calculate reactor vessel dimensions and volumes.
 *
 * Supports cylindrical and spherical reactors.
 *
 * Cylindrical:
 * - Volume = PI * r^2 * h
 * - Surface Area = 2 * PI * r^2 + 2 * PI * r * h (ends + lateral)
 *
 * Spherical:
 * - Volume = (4/3) * PI * r^3
 * - Surface Area = 4 * PI * r^2
 *
 * @param input - Reactor dimensions and fill ratio
 * @returns Reactor volumes and surface area
 * @throws RangeError if diameter is not greater than 0, a cylindrical height is not greater than 0,
 *   or fillRatio is not in (0, 1]
 */
export function reactor(input: ReactorInput): ReactorResult {
  requireFinite('reactor', input);
  const { shape, diameter, fillRatio } = input;

  // A zero diameter gives zero volume over zero surface area, which is not a ratio.
  if (!(diameter > 0)) {
    throw inputRangeError('diameter must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'diameter', exclusive_min: 0, got: diameter,
    });
  }
  // A fill ratio is a fraction of the vessel: a negative one gives a negative working volume,
  // and one above 1 overfills it.
  if (!(fillRatio > 0 && fillRatio <= 1)) {
    throw inputRangeError('fillRatio must be greater than 0 and at most 1', {
      code: 'parameter_out_of_range', parameter: 'fillRatio', exclusive_min: 0, max: 1, got: fillRatio,
    });
  }
  const radius = diameter / 2;
  let totalVolume: number;
  let surfaceArea: number;

  if (shape === 'cylindrical') {
    // Cylindrical reactor
    const h = input.height;
    // A negative height can cancel the end caps and leave zero surface area to divide by.
    if (!(h > 0)) {
      throw inputRangeError('height must be greater than 0', {
        code: 'parameter_out_of_range', parameter: 'height', exclusive_min: 0, got: h,
      });
    }
    // V = PI * r^2 * h
    totalVolume = Math.PI * radius * radius * h;
    // Surface Area = 2 * PI * r^2 (ends) + 2 * PI * r * h (lateral)
    surfaceArea = 2 * Math.PI * radius * radius + 2 * Math.PI * radius * h;
  } else {
    // Spherical reactor
    // V = (4/3) * PI * r^3
    totalVolume = (4 / 3) * Math.PI * radius * radius * radius;
    // Surface Area = 4 * PI * r^2
    surfaceArea = 4 * Math.PI * radius * radius;
  }

  const workingVolume = totalVolume * fillRatio;
  const totalVolumeLiters = totalVolume * 1000; // m^3 to liters
  const workingVolumeLiters = workingVolume * 1000;
  const volumeToSurfaceRatio = totalVolume / surfaceArea;

  return {
    totalVolume: roundTo(totalVolume, 4),
    workingVolume: roundTo(workingVolume, 4),
    totalVolumeLiters: roundTo(totalVolumeLiters, 4),
    workingVolumeLiters: roundTo(workingVolumeLiters, 4),
    surfaceArea: roundTo(surfaceArea, 4),
    volumeToSurfaceRatio: roundTo(volumeToSurfaceRatio, 4),
  };
}

/**
 * Round to specified decimal places
 */
