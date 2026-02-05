import { roundTo } from '../utils.js';
import type { PressFitInput, PressFitResult } from './types.js';

/**
 * Calculate press-fit (interference fit) parameters.
 *
 * Formulas:
 * - Interference: delta = d_shaft - d_hole
 * - Interface pressure: p = delta * E / (d * C)
 *   where C = (d_o^2 + d^2)/(d_o^2 - d^2) + nu (for solid shaft)
 * - Assembly force: F = pi * d * L * p * mu
 * - Holding torque: T = pi * d^2 * L * p * mu / 2
 *
 * Reference: Shigley's Mechanical Engineering Design
 */
export function pressFit(input: PressFitInput): PressFitResult {
  const {
    shaftDiameter,
    holeDiameter,
    hubOuterDiameter,
    contactLength,
    youngsModulus,
    poissonRatio,
    frictionCoefficient,
  } = input;

  // Validate inputs
  if (shaftDiameter <= 0 || holeDiameter <= 0 || hubOuterDiameter <= 0 || contactLength <= 0) {
    return {
      interference: 0,
      interfacePressure: 0,
      assemblyForce: 0,
      assemblyForceKN: 0,
      holdingTorque: 0,
      axialHoldingForce: 0,
      hubHoopStress: 0,
      shaftRadialStress: 0,
    };
  }

  if (hubOuterDiameter <= shaftDiameter) {
    return {
      interference: 0,
      interfacePressure: 0,
      assemblyForce: 0,
      assemblyForceKN: 0,
      holdingTorque: 0,
      axialHoldingForce: 0,
      hubHoopStress: 0,
      shaftRadialStress: 0,
    };
  }

  // Interference (mm)
  const interference = shaftDiameter - holeDiameter;

  if (interference <= 0) {
    return {
      interference: roundTo(interference, 4),
      interfacePressure: 0,
      assemblyForce: 0,
      assemblyForceKN: 0,
      holdingTorque: 0,
      axialHoldingForce: 0,
      hubHoopStress: 0,
      shaftRadialStress: 0,
    };
  }

  // Use nominal interface diameter (average of shaft and hole)
  const d = (shaftDiameter + holeDiameter) / 2; // mm
  const d_o = hubOuterDiameter; // mm

  // Convert Young's modulus from GPa to MPa
  const E = youngsModulus * 1000; // MPa

  // Calculate C factor for thick-walled cylinder with solid shaft
  // C = (d_o^2 + d^2)/(d_o^2 - d^2) + nu
  const d_sq = d * d;
  const d_o_sq = d_o * d_o;
  const C = (d_o_sq + d_sq) / (d_o_sq - d_sq) + poissonRatio;

  // Interface pressure (MPa)
  // p = delta * E / (d * C)
  const interfacePressure = (interference * E) / (d * C);

  // Assembly force (N)
  // F = pi * d * L * p * mu
  const assemblyForce = Math.PI * d * contactLength * interfacePressure * frictionCoefficient;

  // Axial holding force (same as assembly force in ideal case)
  const axialHoldingForce = assemblyForce;

  // Holding torque (N-m)
  // T = pi * d^2 * L * p * mu / 2
  // Note: d in mm, L in mm, p in MPa, result in N-mm, convert to N-m
  const holdingTorque = (Math.PI * d * d * contactLength * interfacePressure * frictionCoefficient) / 2 / 1000;

  // Hoop stress in hub at inner surface (MPa)
  // sigma_theta = p * (d_o^2 + d^2) / (d_o^2 - d^2)
  const hubHoopStress = interfacePressure * (d_o_sq + d_sq) / (d_o_sq - d_sq);

  // Radial stress in shaft at surface (compressive, equals -p)
  const shaftRadialStress = -interfacePressure;

  return {
    interference: roundTo(interference, 4),
    interfacePressure: roundTo(interfacePressure, 2),
    assemblyForce: roundTo(assemblyForce, 1),
    assemblyForceKN: roundTo(assemblyForce / 1000, 3),
    holdingTorque: roundTo(holdingTorque, 2),
    axialHoldingForce: roundTo(axialHoldingForce, 1),
    hubHoopStress: roundTo(hubHoopStress, 2),
    shaftRadialStress: roundTo(shaftRadialStress, 2),
  };
}
