import { roundTo } from '../utils.js';
import type { PressFitInput, PressFitResult } from './types.js';

/**
 * Calculate press-fit (interference fit) parameters.
 *
 * Formulas:
 * - Interference: delta = d_shaft - d_hole
 * - Interface pressure: p = delta * E / (d * C)
 *   where C = (d_o^2 + d^2)/(d_o^2 - d^2) + 1
 * - Assembly force: F = pi * d * L * p * mu
 * - Holding torque: T = pi * d^2 * L * p * mu / 2
 *
 * Model assumptions baked into the `+ 1` constant (see C-factor below):
 * both members are the **same material** (a single E, nu is supplied) and the
 * shaft is **solid** (inner radius = 0). Under these two assumptions Shigley's
 * general interference equation collapses so that the shaft's own compression
 * (p*d/E)(1 - nu) adds to the hub's expansion (p*d/E)[(d_o^2+d^2)/(d_o^2-d^2) + nu],
 * and the two nu terms cancel, leaving a net `+ 1`. A rigid-shaft model (hub
 * deforms alone) would instead keep `+ nu`; using it here — where the shaft is
 * the same material and therefore also yields — overstates p by ~36% for typical
 * steel-on-steel fits. Supporting a hollow shaft or a true dissimilar-material
 * pair (separate E_shaft/E_hub) would require replacing this branch, not tuning
 * the constant.
 *
 * A consequence of the nu cancellation: for this same-material, solid-shaft model
 * the interface pressure and every derived stress are **independent of Poisson's
 * ratio**. `input.poissonRatio` is therefore accepted (it belongs to the material
 * spec and the deferred dissimilar-material model will need it) but intentionally
 * not read here — changing it does not change the result.
 *
 * Reference: Shigley's Mechanical Engineering Design
 */
export function pressFit(input: PressFitInput): PressFitResult {
  // Note: poissonRatio is deliberately not destructured — see JSDoc (nu cancels
  // out of every output for the same-material, solid-shaft model).
  const {
    shaftDiameter,
    holeDiameter,
    hubOuterDiameter,
    contactLength,
    youngsModulus,
    frictionCoefficient,
  } = input;

  // Validate inputs
  if (shaftDiameter <= 0) throw new RangeError('shaftDiameter must be greater than 0');
  if (holeDiameter <= 0) throw new RangeError('holeDiameter must be greater than 0');
  if (hubOuterDiameter <= 0) throw new RangeError('hubOuterDiameter must be greater than 0');
  if (contactLength <= 0) throw new RangeError('contactLength must be greater than 0');

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

  // C factor for a same-material, solid-shaft interference fit (see JSDoc).
  // C = (d_o^2 + d^2)/(d_o^2 - d^2) + 1
  // The `+ 1` (not `+ nu`) accounts for the solid shaft also compressing under the
  // contact pressure; the two Poisson terms cancel, so nu drops out entirely.
  const d_sq = d * d;
  const d_o_sq = d_o * d_o;
  const C = (d_o_sq + d_sq) / (d_o_sq - d_sq) + 1;

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
