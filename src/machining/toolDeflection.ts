import { roundTo } from '../utils.js';
import type { ToolDeflectionInput, ToolDeflectionResult, ToolMaterial } from './types.js';

/**
 * Young's modulus for common tool materials (GPa)
 */
const TOOL_MODULUS: Record<ToolMaterial, number> = {
  carbide: 550,
  hss: 200,
};

/**
 * Calculate end mill deflection using cantilever beam theory.
 *
 * @formula
 *   I = π × d⁴ / 64
 *   δ = F × L³ / (3 × E × I)
 *   k = F / δ
 *
 * @reference Oberg, E. et al. "Machinery's Handbook", 31st Ed. — Beam deflection.
 *
 * @param input - Tool deflection parameters
 * @returns ToolDeflectionResult with deflection, inertia, and stiffness
 */
export function toolDeflection(input: ToolDeflectionInput): ToolDeflectionResult {
  const { toolDiameter, stickout, cuttingForce, material = 'carbide' } = input;

  if (toolDiameter <= 0) throw new RangeError('toolDiameter must be positive');
  if (stickout <= 0) throw new RangeError('stickout must be positive');
  if (cuttingForce < 0) throw new RangeError('cuttingForce must be non-negative');

  const E = input.youngsModulus ?? TOOL_MODULUS[material];
  const E_MPa = E * 1000; // GPa → MPa (N/mm²)

  const I = (Math.PI * Math.pow(toolDiameter, 4)) / 64;
  const delta = (cuttingForce * Math.pow(stickout, 3)) / (3 * E_MPa * I);
  const stiffness = (3 * E_MPa * I) / Math.pow(stickout, 3);

  return {
    deflection: roundTo(delta, 6),
    momentOfInertia: roundTo(I, 4),
    stiffness: roundTo(stiffness, 2),
    youngsModulus: E,
  };
}
