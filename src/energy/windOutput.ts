import { roundTo } from '../utils.js';
import type { WindOutputInput, WindOutputResult } from './types.js';

/**
 * Wind Power Output Calculator
 *
 * @formula
 *   - V_hub = V_ref × (H_hub / H_ref)^α  (Hellmann power law)
 *   - Capacity Factor from simplified Rayleigh-based estimate
 *   - Annual Output = ratedPower × CF × 8760
 *
 * @reference IEC 61400 — Wind energy generation systems
 * @reference Manwell, J.F. "Wind Energy Explained", 2nd Ed. Wiley.
 */
export function windOutput(input: WindOutputInput): WindOutputResult {
  const {
    ratedPower, hubHeight, averageWindSpeed,
    referenceHeight = 10,
    cutInSpeed = 3,
    cutOutSpeed = 25,
    ratedSpeed = 12,
    rotorDiameter,
    terrainRoughness = 0.143,
  } = input;

  // Wind speed at hub height (Hellmann power law)
  const adjustedWindSpeed = averageWindSpeed * Math.pow(hubHeight / referenceHeight, terrainRoughness);

  // Simplified capacity factor estimate using Rayleigh distribution approximation
  // CF ≈ exp(-(cutIn/c)^k) - exp(-(ratedSpeed/c)^k) × Pr_avg/Prated
  //    + exp(-(ratedSpeed/c)^k) - exp(-(cutOut/c)^k)
  // Simplified: using cubic ratio with Rayleigh distribution
  const k = 2; // Weibull shape parameter for Rayleigh
  const c = adjustedWindSpeed * 2 / Math.sqrt(Math.PI); // scale parameter

  let cf: number;
  if (adjustedWindSpeed <= 0 || c <= 0) {
    cf = 0;
  } else {
    // Probability of wind in each region
    const pRated = Math.exp(-Math.pow(ratedSpeed / c, k));
    const pCutOut = Math.exp(-Math.pow(cutOutSpeed / c, k));

    // Cubic region: approximate average power as fraction of rated
    // Using integral of (v/vr)^3 × Rayleigh
    const cubicContrib = integrateCubicRayleigh(cutInSpeed, ratedSpeed, c, ratedSpeed);

    // Rated region: full power between rated and cutout
    const ratedContrib = pRated - pCutOut;

    cf = Math.max(0, Math.min(1, cubicContrib + ratedContrib));
  }

  const annualOutput = ratedPower * cf * 8760;
  const monthlyOutput = annualOutput / 12;
  const dailyOutput = annualOutput / 365;

  // Swept area
  let sweptArea: number | null = null;
  let betzLimit: number | null = null;
  if (rotorDiameter != null) {
    sweptArea = roundTo(Math.PI * (rotorDiameter / 2) ** 2, 2);
    // Betz limit: P_max = 16/27 × 0.5 × ρ × A × v³
    const airDensity = 1.225; // kg/m³
    betzLimit = roundTo((16 / 27) * 0.5 * airDensity * sweptArea * Math.pow(adjustedWindSpeed, 3) / 1000, 2);
  }

  return {
    adjustedWindSpeed: roundTo(adjustedWindSpeed, 2),
    capacityFactor: roundTo(cf, 4),
    annualOutput: roundTo(annualOutput, 0),
    monthlyOutput: roundTo(monthlyOutput, 0),
    dailyOutput: roundTo(dailyOutput, 0),
    sweptArea,
    betzLimit,
  };
}

/**
 * Approximate integral of (v/vr)^3 × Rayleigh PDF from v1 to v2
 * Using numerical trapezoidal integration
 */
function integrateCubicRayleigh(v1: number, v2: number, c: number, vRated: number): number {
  const steps = 50;
  const dv = (v2 - v1) / steps;
  let sum = 0;

  for (let i = 0; i <= steps; i++) {
    const v = v1 + i * dv;
    const rayleighPDF = (2 * v / (c * c)) * Math.exp(-Math.pow(v / c, 2));
    const cubicPower = Math.pow(v / vRated, 3);
    const weight = (i === 0 || i === steps) ? 0.5 : 1;
    sum += weight * cubicPower * rayleighPDF;
  }

  return sum * dv;
}
