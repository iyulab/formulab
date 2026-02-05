import type { ViaInput, ViaResult } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Round to specified decimal places
 */

// Copper resistivity at 20°C in Ω·mm²/m
const COPPER_RESISTIVITY = 0.01724;

// IPC-2152 via current capacity constants
// I = k × ΔT^b × A^c
// For internal vias: k=0.048, b=0.44, c=0.725 (similar to internal traces)
const IPC_K = 0.048;
const IPC_B = 0.44;
const IPC_C = 0.725;

/**
 * Calculate PCB via current capacity using IPC-2152 approximation
 *
 * The cross-sectional area is the copper ring: π × [(r_outer)² - (r_inner)²]
 * Where r_outer = holeDiameter/2 + platingThickness and r_inner = holeDiameter/2
 *
 * @param input - Via hole diameter, plating thickness, via length, and temp rise
 * @returns Via current capacity and related properties, or null if invalid
 */
export function viaCurrent(input: ViaInput): ViaResult | null {
  const { holeDiameter, platingThickness, viaLength, tempRise } = input;

  // Validate inputs
  if (holeDiameter <= 0 || platingThickness <= 0 || viaLength <= 0 || tempRise <= 0) {
    return null;
  }

  // Convert plating thickness from μm to mm
  const platingMm = platingThickness / 1000;

  // Calculate inner and outer radii
  const innerRadius = holeDiameter / 2;
  const outerRadius = innerRadius + platingMm;

  // Cross-sectional area of the copper ring (mm²)
  const crossSectionMm2 = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);

  // For IPC-2152, convert area to mils² (1 mm = 39.37 mils)
  const crossSectionMils2 = crossSectionMm2 * 39.37 * 39.37;

  // Current capacity using IPC-2152 formula (similar to internal layer)
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
    thermalResistance: roundTo(thermalResistance, 2),
    resistanceMOhm: roundTo(resistanceMOhm, 4),
    powerDissipation: roundTo(powerDissipation, 2),
  };
}
