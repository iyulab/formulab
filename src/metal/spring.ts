import type { SpringInput, SpringMaterial, SpringResult } from './types.js';

// Shear modulus (G) in MPa for common spring materials
const SHEAR_MODULUS: Record<SpringMaterial, number> = {
  musicWire: 79300,       // ASTM A228 music wire
  stainless302: 69000,    // Stainless steel 302
  phosphorBronze: 41000,  // Phosphor bronze
  berylliumCopper: 48000, // Beryllium copper
};

/**
 * Calculate helical compression/extension spring properties.
 *
 * Spring rate: k = Gd^4 / (8D^3 x n)
 * Spring index: C = D/d
 * Wahl stress correction factor: Ks = (4C - 1)/(4C - 4) + 0.615/C
 * Shear stress: tau = 8PD / (pi x d^3) x Ks
 */
export function spring(input: SpringInput): SpringResult {
  const { wireDiameter, meanCoilDiameter, activeCoils, force, material } = input;

  // Validate inputs
  if (wireDiameter <= 0 || meanCoilDiameter <= 0 || activeCoils <= 0) {
    return {
      springRate: 0,
      springIndex: 0,
      stressCorrectionFactor: 0,
      shearModulus: 0,
    };
  }

  const d = wireDiameter;
  const D = meanCoilDiameter;
  const n = activeCoils;

  // Get shear modulus (default to music wire if not specified)
  const G = SHEAR_MODULUS[material ?? 'musicWire'];

  // Spring index
  const C = D / d;

  // Wahl stress correction factor
  const Ks = ((4 * C - 1) / (4 * C - 4)) + (0.615 / C);

  // Spring rate: k = Gd^4 / (8D^3n)
  const d4 = Math.pow(d, 4);
  const D3 = Math.pow(D, 3);
  const k = (G * d4) / (8 * D3 * n);

  const result: SpringResult = {
    springRate: roundTo(k, 3),
    springIndex: roundTo(C, 2),
    stressCorrectionFactor: roundTo(Ks, 3),
    shearModulus: G,
  };

  // Calculate shear stress if force is provided
  if (force !== undefined && force > 0) {
    // tau = 8PD / (pi x d^3) x Ks
    const d3 = Math.pow(d, 3);
    const tau = (8 * force * D) / (Math.PI * d3) * Ks;
    result.shearStress = roundTo(tau, 1);
  }

  return result;
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
