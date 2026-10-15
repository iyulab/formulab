import { roundTo, requireFinite } from '../utils.js';
import type { ToolDeflectionInput, ToolDeflectionResult, ToolMaterial } from './types.js';
import { inputRangeError } from '../errors.js';

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
 * @throws RangeError if toolDiameter, stickout or the Young's modulus is not positive, or cuttingForce is negative
 */
export function toolDeflection(input: ToolDeflectionInput): ToolDeflectionResult {
  requireFinite('toolDeflection', input);
  const { toolDiameter, stickout, cuttingForce, material = 'carbide' } = input;

  if (toolDiameter <= 0) {
    throw inputRangeError('toolDiameter must be positive', {
      code: 'parameter_out_of_range', parameter: 'toolDiameter', exclusive_min: 0, got: toolDiameter,
    });
  }
  if (stickout <= 0) {
    throw inputRangeError('stickout must be positive', {
      code: 'parameter_out_of_range', parameter: 'stickout', exclusive_min: 0, got: stickout,
    });
  }
  if (cuttingForce < 0) {
    throw inputRangeError('cuttingForce must be non-negative', {
      code: 'parameter_out_of_range', parameter: 'cuttingForce', min: 0, got: cuttingForce,
    });
  }

  const E = input.youngsModulus ?? TOOL_MODULUS[material];
  if (!(E > 0)) {
    throw inputRangeError('youngsModulus must be positive', {
      code: 'parameter_out_of_range', parameter: 'youngsModulus', exclusive_min: 0, got: E,
    });
  }
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
