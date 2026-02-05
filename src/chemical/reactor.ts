import type { ReactorInput, ReactorResult } from './types.js';
import { roundTo } from '../utils.js';

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
 */
export function reactor(input: ReactorInput): ReactorResult {
  const { shape, diameter, height, fillRatio } = input;

  const radius = diameter / 2;
  let totalVolume: number;
  let surfaceArea: number;

  if (shape === 'cylindrical') {
    // Cylindrical reactor
    const h = height!;
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
