import type { AwgInput, AwgResult, AwgMaterial } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Round to specified decimal places
 */

// Resistivity at 20°C in Ω·mm²/m
const RESISTIVITY_20C: Record<AwgMaterial, number> = {
  copper: 0.01724,
  aluminum: 0.02826,
};

// Temperature coefficient in 1/°C
const TEMP_COEFFICIENT: Record<AwgMaterial, number> = {
  copper: 0.00393,
  aluminum: 0.00403,
};

// Current capacity for chassis wiring (30°C ambient, single conductor in air)
// Values based on common wire tables, roughly 5.5 A/mm² for copper
const CURRENT_DENSITY: Record<AwgMaterial, number> = {
  copper: 5.5,     // A/mm²
  aluminum: 4.3,   // A/mm² (aluminum is less conductive)
};

/**
 * Calculate AWG wire properties
 * AWG diameter formula: d(mm) = 0.127 × 92^((36-AWG)/39)
 * @param input - AWG gauge number, material, and temperature
 * @returns Wire properties or null if invalid input
 */
export function awgProperties(input: AwgInput): AwgResult | null {
  const { awg, material, tempC } = input;

  // Validate input range
  if (awg < 0 || awg > 40) {
    return null;
  }

  // Calculate diameter using AWG formula
  // d(inch) = 0.005 × 92^((36-AWG)/39) → d(mm) = 0.127 × 92^((36-AWG)/39)
  const diameterMm = 0.127 * Math.pow(92, (36 - awg) / 39);
  const diameterMils = diameterMm / 0.0254;

  // Cross-sectional area
  const radiusMm = diameterMm / 2;
  const areaMm2 = Math.PI * radiusMm * radiusMm;

  // Circular mils: (diameter in mils)²
  const areaCircularMils = diameterMils * diameterMils;

  // Resistance per meter at operating temperature
  // R = ρ / A × [1 + α(T - 20)]
  const resistivity = RESISTIVITY_20C[material];
  const tempCoeff = TEMP_COEFFICIENT[material];
  const tempFactor = 1 + tempCoeff * (tempC - 20);
  const resistancePerM = (resistivity / areaMm2) * tempFactor;

  // Resistance per foot (1 ft = 0.3048 m)
  const resistancePerFt = resistancePerM * 0.3048;

  // Current capacity for chassis wiring
  const currentDensity = CURRENT_DENSITY[material];
  const currentCapacity = currentDensity * areaMm2;

  return {
    diameterMm: roundTo(diameterMm, 4),
    diameterMils: roundTo(diameterMils, 2),
    areaMm2: roundTo(areaMm2, 4),
    areaCircularMils: roundTo(areaCircularMils, 0),
    resistancePerM: roundTo(resistancePerM, 5),
    resistancePerFt: roundTo(resistancePerFt, 5),
    currentCapacity: roundTo(currentCapacity, 2),
  };
}
