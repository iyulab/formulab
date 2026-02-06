import { roundTo } from '../utils.js';
import type { BoringBarDeflectionInput, BoringBarDeflectionResult, BoringBarMaterial } from './types.js';

/**
 * Young's modulus for boring bar materials (GPa)
 */
const BAR_MODULUS: Record<BoringBarMaterial, number> = {
  carbide: 550,
  steel: 200,
  heavyMetal: 250,
};

/**
 * Calculate boring bar deflection using cantilever beam theory.
 *
 * @formula
 *   I = π × d⁴ / 64
 *   δ = F × L³ / (3 × E × I)
 *   L/D ratio determines stability recommendation
 *
 * @reference Sandvik Coromant — Boring bar selection guide.
 *   L/D < 4: steel, L/D 4-6: carbide, L/D 6-10: heavy metal/damped
 *
 * @param input - Boring bar deflection parameters
 * @returns BoringBarDeflectionResult with deflection, L/D ratio, and recommendation
 */
export function boringBarDeflection(input: BoringBarDeflectionInput): BoringBarDeflectionResult {
  const { barDiameter, overhang, cuttingForce, material = 'steel' } = input;

  const E = input.youngsModulus ?? BAR_MODULUS[material];
  const E_MPa = E * 1000; // GPa → MPa

  const I = (Math.PI * Math.pow(barDiameter, 4)) / 64;
  const delta = (cuttingForce * Math.pow(overhang, 3)) / (3 * E_MPa * I);
  const stiffness = delta > 0 ? cuttingForce / delta : Infinity;
  const ldRatio = overhang / barDiameter;

  let recommendation: string;
  if (ldRatio <= 4) {
    recommendation = 'Steel bar suitable';
  } else if (ldRatio <= 6) {
    recommendation = 'Carbide bar recommended';
  } else if (ldRatio <= 10) {
    recommendation = 'Heavy metal or damped bar recommended';
  } else {
    recommendation = 'L/D exceeds practical limits; reduce overhang';
  }

  return {
    deflection: roundTo(delta, 6),
    momentOfInertia: roundTo(I, 4),
    stiffness: roundTo(stiffness, 2),
    ldRatio: roundTo(ldRatio, 2),
    youngsModulus: E,
    recommendation,
  };
}
