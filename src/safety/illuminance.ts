import { roundTo } from '../utils.js';
import type { IlluminanceInput, IlluminanceResult } from './types.js';

/**
 * Simple CU lookup by room index (linear interpolation).
 * Based on typical reflectance values (ceiling 70%, wall 50%, floor 20%).
 */
const CU_TABLE: [number, number][] = [
  [0.6, 0.22],
  [1.0, 0.34],
  [1.5, 0.45],
  [2.0, 0.52],
  [2.5, 0.57],
  [3.0, 0.60],
  [4.0, 0.65],
  [5.0, 0.68],
];

function lookupCU(roomIndex: number): number {
  if (roomIndex <= CU_TABLE[0][0]) return CU_TABLE[0][1];
  if (roomIndex >= CU_TABLE[CU_TABLE.length - 1][0]) return CU_TABLE[CU_TABLE.length - 1][1];

  for (let i = 0; i < CU_TABLE.length - 1; i++) {
    const [ri0, cu0] = CU_TABLE[i];
    const [ri1, cu1] = CU_TABLE[i + 1];
    if (roomIndex >= ri0 && roomIndex <= ri1) {
      const t = (roomIndex - ri0) / (ri1 - ri0);
      return cu0 + t * (cu1 - cu0);
    }
  }
  return CU_TABLE[CU_TABLE.length - 1][1];
}

/**
 * Calculate illuminance using the Lumen Method.
 *
 * N = (E × A) / (Φ × CU × MF)
 * Room Index = (L × W) / (Hm × (L + W))
 * Hm = luminaire height − workplane height
 *
 * @param input - Room dimensions and lighting parameters
 * @returns Number of fixtures needed and lighting metrics
 */
export function illuminance(input: IlluminanceInput): IlluminanceResult {
  const {
    roomLength,
    roomWidth,
    luminaireHeight,
    workplaneHeight = 0.85,
    targetLux,
    lumensPerLuminaire,
    wattsPerLuminaire,
    cu: cuOverride,
    mf = 0.8,
  } = input;

  if (roomLength <= 0 || roomWidth <= 0 || lumensPerLuminaire <= 0 || targetLux <= 0) {
    return {
      fixturesNeeded: 0,
      actualLux: 0,
      roomIndex: 0,
      totalLumens: 0,
      powerDensity: null,
      recommendedSpacing: 0,
    };
  }

  const area = roomLength * roomWidth;
  const hm = luminaireHeight - workplaneHeight;

  if (hm <= 0) {
    return {
      fixturesNeeded: 0,
      actualLux: 0,
      roomIndex: 0,
      totalLumens: 0,
      powerDensity: null,
      recommendedSpacing: 0,
    };
  }

  // Room Index (Cavity Ratio)
  const roomIndex = (roomLength * roomWidth) / (hm * (roomLength + roomWidth));

  // Coefficient of Utilization
  const cu = cuOverride ?? lookupCU(roomIndex);

  // Number of luminaires: N = (E × A) / (Φ × CU × MF)
  const nExact = (targetLux * area) / (lumensPerLuminaire * cu * mf);
  const fixturesNeeded = Math.ceil(nExact);

  // Actual lux with rounded fixture count
  const totalLumens = fixturesNeeded * lumensPerLuminaire;
  const actualLux = (totalLumens * cu * mf) / area;

  // Power density
  let powerDensity: number | null = null;
  if (wattsPerLuminaire !== undefined && wattsPerLuminaire > 0) {
    powerDensity = (fixturesNeeded * wattsPerLuminaire) / area;
  }

  // Recommended max spacing = 1.5 × Hm
  const recommendedSpacing = 1.5 * hm;

  return {
    fixturesNeeded,
    actualLux: roundTo(actualLux, 4),
    roomIndex: roundTo(roomIndex, 4),
    totalLumens: roundTo(totalLumens, 4),
    powerDensity: powerDensity !== null ? roundTo(powerDensity, 4) : null,
    recommendedSpacing: roundTo(recommendedSpacing, 4),
  };
}
