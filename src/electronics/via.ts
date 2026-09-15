import type { ViaInput, ViaResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Round to specified decimal places
 */

// Copper resistivity at 20°C in Ω·mm²/m
const COPPER_RESISTIVITY = 0.01724;

// IPC-2221 conductor formula constants — external-layer k (IPC-2221 internal layers use k = 0.024).
// I = k × ΔT^b × A^c
// A via has no chart of its own in IPC-2221; the common convention applies the conductor formula to
// the plated barrel's copper cross-section with the external constant, since the barrel reaches both
// outer surfaces. IPC-2152 gives more detailed thermal guidance but is not what this computes.
const IPC_K = 0.048;
const IPC_B = 0.44;
const IPC_C = 0.725;

/**
 * Calculate PCB via current capacity with the IPC-2221 conductor formula (external-layer constant)
 * applied to the plated barrel's copper ring
 *
 * The cross-sectional area is the copper ring: π × [(r_outer)² - (r_inner)²]
 * Where r_outer = holeDiameter/2 + platingThickness and r_inner = holeDiameter/2
 *
 * @param input - Via hole diameter, plating thickness, via length, and temp rise
 * @returns Via current capacity and related properties
 * @throws RangeError if holeDiameter, platingThickness, viaLength, or tempRise
 *   is not positive
 */
export function viaCurrent(input: ViaInput): ViaResult {
  const { holeDiameter, platingThickness, viaLength, tempRise } = input;

  // Validate inputs
  if (holeDiameter <= 0) {
    throw new RangeError('holeDiameter must be greater than 0');
  }
  if (platingThickness <= 0) {
    throw new RangeError('platingThickness must be greater than 0');
  }
  if (viaLength <= 0) {
    throw new RangeError('viaLength must be greater than 0');
  }
  if (tempRise <= 0) {
    throw new RangeError('tempRise must be greater than 0');
  }

  // Convert plating thickness from μm to mm
  const platingMm = platingThickness / 1000;

  // Calculate inner and outer radii
  const innerRadius = holeDiameter / 2;
  const outerRadius = innerRadius + platingMm;

  // Cross-sectional area of the copper ring (mm²)
  const crossSectionMm2 = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);

  // The IPC-2221 formula takes the area in mils² (1 mm = 39.37 mils)
  const crossSectionMils2 = crossSectionMm2 * 39.37 * 39.37;

  // Current capacity, IPC-2221 conductor formula with the external-layer constant
  // I = k × ΔT^b × A^c
  const currentCapacity = IPC_K * Math.pow(tempRise, IPC_B) * Math.pow(crossSectionMils2, IPC_C);

  // Via resistance (Ω)
  // R = ρ × L / A (where ρ is in Ω·mm²/m, L in m, A in mm²)
  const viaLengthM = viaLength / 1000;
  const resistance = (COPPER_RESISTIVITY * viaLengthM) / crossSectionMm2;
  const resistanceMOhm = resistance * 1000; // Convert to mΩ

  // Thermal resistance approximation (simplified)
  // For a cylindrical via: Rth ≈ L / (k × A) where k is thermal conductivity
  // Copper thermal conductivity ≈ 385 W/(m·K)
  const COPPER_THERMAL_CONDUCTIVITY = 385;
  const thermalResistance = viaLengthM / (COPPER_THERMAL_CONDUCTIVITY * crossSectionMm2 / 1000000);

  // Power dissipation at maximum current (mW)
  const powerDissipation = currentCapacity * currentCapacity * resistance * 1000;

  return {
    currentCapacity: roundTo(currentCapacity, 2),
    crossSectionMm2: roundTo(crossSectionMm2, 5),
    platingThicknessMm: roundTo(platingMm, 6),
    barrelOuterDiameterMm: roundTo(outerRadius * 2, 6),
    thermalResistance: roundTo(thermalResistance, 2),
    resistanceMOhm: roundTo(resistanceMOhm, 4),
    powerDissipation: roundTo(powerDissipation, 2),
  };
}
