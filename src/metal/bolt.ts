import { roundTo } from '../utils.js';
import type { BoltInput, BoltResult } from './types.js';

/**
 * Calculate bolt torque and preload relationship.
 *
 * Formulas:
 * - T = K * D * F (Torque-tension relationship)
 *   T = torque (N-m)
 *   K = nut factor (K-factor), typically 0.15-0.25
 *   D = nominal bolt diameter (mm)
 *   F = preload force (N)
 *
 * - Tensile stress area: As = (pi/4) * (d - 0.9382*p)^2
 *   (ISO metric thread formula)
 *
 * K-factor typical values:
 * - Dry (unlubricated): 0.20
 * - Oiled (machine oil): 0.15
 * - Moly (MoS2 grease): 0.12
 * - PTFE (Teflon): 0.10
 *
 * Reference: Machinery's Handbook, VDI 2230
 */
export function bolt(input: BoltInput): BoltResult {
  const {
    mode,
    diameter,
    pitch,
    torque: inputTorque,
    preload: inputPreload,
    kFactor,
    tensileStrength,
  } = input;

  // Validate inputs
  if (diameter <= 0 || pitch <= 0 || kFactor <= 0 || tensileStrength <= 0) {
    return {
      torque: 0,
      preload: 0,
      preloadN: 0,
      stressArea: 0,
      tensileStress: 0,
      strengthUtilization: 0,
      kFactor: 0,
      recommendedMaxPreload: 0,
    };
  }

  // Calculate tensile stress area (ISO metric thread)
  // As = (pi/4) * (d - 0.9382*p)^2
  const d_stress = diameter - 0.9382 * pitch;
  const stressArea = (Math.PI / 4) * d_stress * d_stress;

  let torque: number;
  let preloadN: number;

  if (mode === 'torqueToPreload') {
    // Given torque, calculate preload
    torque = inputTorque ?? 0;
    if (torque <= 0) {
      return {
        torque: 0,
        preload: 0,
        preloadN: 0,
        stressArea: roundTo(stressArea, 2),
        tensileStress: 0,
        strengthUtilization: 0,
        kFactor,
        recommendedMaxPreload: 0,
      };
    }
    // T = K * D * F => F = T / (K * D)
    // T in N-m, D in mm => need to convert D to m: D/1000
    // F = T / (K * D/1000) = T * 1000 / (K * D)
    preloadN = (torque * 1000) / (kFactor * diameter);
  } else {
    // Given preload, calculate torque
    const preloadKN = inputPreload ?? 0;
    if (preloadKN <= 0) {
      return {
        torque: 0,
        preload: 0,
        preloadN: 0,
        stressArea: roundTo(stressArea, 2),
        tensileStress: 0,
        strengthUtilization: 0,
        kFactor,
        recommendedMaxPreload: 0,
      };
    }
    preloadN = preloadKN * 1000;
    // T = K * D * F
    // T in N-m, D in mm, F in N => T = K * (D/1000) * F
    torque = kFactor * (diameter / 1000) * preloadN;
  }

  const preloadKN = preloadN / 1000;

  // Tensile stress = F / As
  const tensileStress = preloadN / stressArea;

  // Strength utilization (percentage of tensile strength)
  const strengthUtilization = (tensileStress / tensileStrength) * 100;

  // Recommended max preload at 75% of tensile strength
  // (typical design guideline for static loading)
  const maxStress = tensileStrength * 0.75;
  const recommendedMaxPreloadN = maxStress * stressArea;
  const recommendedMaxPreload = recommendedMaxPreloadN / 1000;

  return {
    torque: roundTo(torque, 2),
    preload: roundTo(preloadKN, 3),
    preloadN: roundTo(preloadN, 1),
    stressArea: roundTo(stressArea, 2),
    tensileStress: roundTo(tensileStress, 1),
    strengthUtilization: roundTo(strengthUtilization, 1),
    kFactor: roundTo(kFactor, 3),
    recommendedMaxPreload: roundTo(recommendedMaxPreload, 2),
  };
}

/**
 * Get K-factor for common lubrication conditions
 */
export function getKFactor(condition: string): number {
  const factors: Record<string, number> = {
    dry: 0.20,
    oiled: 0.15,
    moly: 0.12,
    ptfe: 0.10,
  };
  return factors[condition] ?? 0.20;
}

/**
 * Get standard ISO metric thread pitch for nominal diameter
 */
export function getStandardPitch(diameter: number): number {
  const pitches: Record<number, number> = {
    3: 0.5,
    4: 0.7,
    5: 0.8,
    6: 1.0,
    8: 1.25,
    10: 1.5,
    12: 1.75,
    14: 2.0,
    16: 2.0,
    18: 2.5,
    20: 2.5,
    22: 2.5,
    24: 3.0,
    27: 3.0,
    30: 3.5,
    33: 3.5,
    36: 4.0,
    39: 4.0,
    42: 4.5,
    45: 4.5,
    48: 5.0,
  };
  return pitches[diameter] ?? (diameter >= 6 ? diameter * 0.125 : 0.5);
}
