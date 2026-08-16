import { roundTo } from '../utils.js';
import type { BoringBarDeflectionInput, BoringBarDeflectionResult, BoringBarMaterial } from './types.js';

/**
 * Young's modulus for boring bar materials (GPa).
 *
 * carbide/steel are cemented-carbide and alloy-steel textbook values. heavyMetal is a
 * tungsten-nickel-iron/copper heavy alloy (the material used in damped boring bar cores, e.g.
 * Densimet/Inermet-class 90-97wt% W grades) — manufacturer data sheets report 276-365 GPa across
 * that composition range (Buffalo Tungsten MT-17/MT-18 series); 300 GPa is a representative
 * mid-range value, not a single standard-specified constant.
 */
const BAR_MODULUS: Record<BoringBarMaterial, number> = {
  carbide: 550,
  steel: 200,
  heavyMetal: 300,
};

/**
 * Calculate boring bar deflection using cantilever beam theory.
 *
 * @formula
 *   I = π × d⁴ / 64
 *   δ = F × L³ / (3 × E × I)
 *   L/D ratio determines stability recommendation
 *
 * @reference Beam deflection: standard cantilever theory (Oberg, E. et al. "Machinery's
 *   Handbook", 31st Ed.). The L/D < 4 / 4-6 / 6-10 material-selection bands are a general
 *   shop-practice rule of thumb, not a numeric table published by a single named source —
 *   Sandvik Coromant's own published overhang limits are structured differently (by dampened
 *   vs. non-dampened adapter, not by bar material) and run higher, up to 10-18×D for its damped
 *   product lines. Treat the bands here as a starting-point heuristic, not a cited standard.
 *
 * @param input - Boring bar deflection parameters
 * @returns BoringBarDeflectionResult with deflection, L/D ratio, and recommendation
 */
export function boringBarDeflection(input: BoringBarDeflectionInput): BoringBarDeflectionResult {
  const { barDiameter, overhang, cuttingForce, material = 'steel' } = input;

  if (barDiameter <= 0) throw new RangeError('barDiameter must be positive');
  if (overhang <= 0) throw new RangeError('overhang must be positive');
  if (cuttingForce < 0) throw new RangeError('cuttingForce must be non-negative');

  const E = input.youngsModulus ?? BAR_MODULUS[material];
  const E_MPa = E * 1000; // GPa → MPa

  const I = (Math.PI * Math.pow(barDiameter, 4)) / 64;
  const delta = (cuttingForce * Math.pow(overhang, 3)) / (3 * E_MPa * I);
  const stiffness = (3 * E_MPa * I) / Math.pow(overhang, 3);
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
