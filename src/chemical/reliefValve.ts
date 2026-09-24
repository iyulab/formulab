import { roundTo } from '../utils.js';
import type { ReliefValveInput, ReliefValveResult } from './types.js';

// API 526 standard orifice designations (mm²)
const API_ORIFICES: { letter: string; area: number }[] = [
  { letter: 'D', area: 71 },
  { letter: 'E', area: 126 },
  { letter: 'F', area: 198 },
  { letter: 'G', area: 325 },
  { letter: 'H', area: 506 },
  { letter: 'J', area: 830 },
  { letter: 'K', area: 1186 },
  { letter: 'L', area: 1841 },
  { letter: 'M', area: 2323 },
  { letter: 'N', area: 2800 },
  { letter: 'P', area: 4116 },
  { letter: 'Q', area: 7126 },
  { letter: 'R', area: 10323 },
  { letter: 'T', area: 16774 },
];

/**
 * Relief Valve Sizing — API 520 Part I, SI units
 *
 * @formula
 *   - Gas/vapour, critical flow: A = W / (C × Kd × P1 × Kb × Kc) × √(T × Z / M)
 *     with C = 0.03948 × √(k × (2 / (k + 1))^((k + 1) / (k − 1)))
 *     (A mm², W kg/h, P1 kPa absolute, T K, M kg/kmol)
 *   - Liquid: A = 11.78 × Q / (Kd × Kw × Kc × Kv) × √(G / (P1 − P2))
 *     (A mm², Q L/min, P1 − P2 kPa)
 *   - Relieving pressure P1 = set pressure × (1 + overpressure) + atmospheric
 *   - Standard orifice selection per API 526
 *
 * Steam is sized with the gas equation at k = 1.3 unless `specificHeatRatio` is given; API 520's
 * dedicated Napier steam equation is not implemented. Kb, Kw, Kc and Kv are taken as 1.0.
 *
 * @reference API 520 Part I — Sizing and Selection of Pressure-Relieving Devices (SI equations)
 * @reference API 526 (2017) — Flanged Steel Pressure-Relief Valves
 * @validation API 520 Part I Example 1 (gas: 24,270 kg/h, 348 K, Z 0.90, M 51, k 1.11, P1 670 kPa a
 *   → 3,699 mm²) and the first step of Example 5 (liquid: 6,814 L/min, G 0.9, Kw 0.97, ΔP 1,551.6 kPa
 *   → 3,066 mm²), as reproduced by the `fluids` library
 *
 * When the required area exceeds the largest API 526 orifice ('T', 16,774 mm²), the result
 * still reports 'T' as the closest standard size but sets `orificeExceedsMax: true` — a single
 * valve cannot provide the required capacity (multiple valves in parallel are needed). Callers
 * should surface this to the user; `percentUtilized` will be > 100 in that case.
 * `suggestedMinValves` gives the first-order parallel count (`ceil(requiredArea / T)`); an
 * actual multi-valve installation must be re-sized per API 520, since inlet and back-pressure
 * corrections change each valve's capacity.
 *
 * @throws {RangeError} molecularWeight, specificGravity, specificHeatRatio (must exceed 1) or
 *   compressibility is not positive
 */
export function reliefValve(input: ReliefValveInput): ReliefValveResult {
  const {
    requiredCapacity, setPressure, backPressure, temperature, fluidType,
    molecularWeight = 29, specificGravity = 1.0,
    overpressure = 10, dischargeCoefficient,
    specificHeatRatio = fluidType === 'steam' ? 1.3 : 1.4,
    compressibility = 1.0,
  } = input;

  // The gas/steam sizing equation divides by sqrt(M) after taking its square root, so a
  // non-positive molecular weight gives an infinite or imaginary orifice area.
  if (!(molecularWeight > 0)) {
    throw new RangeError('molecularWeight must be greater than 0');
  }
  if (!(specificGravity > 0)) {
    throw new RangeError('specificGravity must be greater than 0');
  }
  if (!(specificHeatRatio > 1)) {
    throw new RangeError('specificHeatRatio must be greater than 1');
  }
  if (!(compressibility > 0)) {
    throw new RangeError('compressibility must be greater than 0');
  }

  // Atmospheric pressure
  const patm = 101.325; // kPa
  const P1 = setPressure + patm + (setPressure * overpressure / 100); // kPa absolute (relieving)
  const relievingPressure = P1;

  let requiredArea: number; // mm²

  if (fluidType === 'gas' || fluidType === 'steam') {
    const Kd = dischargeCoefficient ?? 0.975;
    const Kb = 1.0; // Back pressure correction (conventional valve below critical back pressure)
    const Kc = 1.0; // Combination correction (no rupture disk)
    const T = temperature + 273.15;
    const k = specificHeatRatio;
    // API 520 SI coefficient: C(1.4) = 0.02703, C(1.35) = 0.02669
    const C = 0.03948 * Math.sqrt(k * Math.pow(2 / (k + 1), (k + 1) / (k - 1)));
    requiredArea = (requiredCapacity / (C * Kd * P1 * Kb * Kc)) * Math.sqrt((T * compressibility) / molecularWeight);
  } else {
    // Liquid
    const Kd = dischargeCoefficient ?? 0.65;
    const Kw = 1.0; // Back pressure correction (conventional valve)
    const Kc = 1.0;
    const Kv = 1.0; // Viscosity correction
    const dp = P1 - (backPressure + patm); // kPa
    const G = specificGravity;
    if (dp <= 0) {
      requiredArea = 0;
    } else {
      const QLpm = (requiredCapacity / (G * 999)) * 1000 / 60; // kg/h → L/min
      requiredArea = ((11.78 * QLpm) / (Kd * Kw * Kc * Kv)) * Math.sqrt(G / dp);
    }
  }

  // Select the smallest standard orifice that covers the required area. API 526 tops out at
  // 'T' (16,774 mm²) — realistic large reliefs do exceed it (e.g. gas 50,000 kg/h @ 1,000 kPa(g)
  // needs ~43,000 mm²). When that happens 'T' is reported as the closest standard size, but it is
  // NOT adequate on its own, so flag it instead of presenting 'T' as a valid single-valve selection.
  let selectedOrifice = API_ORIFICES[API_ORIFICES.length - 1];
  for (const orifice of API_ORIFICES) {
    if (orifice.area >= requiredArea) {
      selectedOrifice = orifice;
      break;
    }
  }
  const orificeExceedsMax = requiredArea > selectedOrifice.area;
  // First-order minimum parallel-'T' count; 1 covers requiredArea = 0 (liquid dp <= 0 edge)
  const maxOrificeArea = API_ORIFICES[API_ORIFICES.length - 1].area;
  const suggestedMinValves = Math.max(1, Math.ceil(requiredArea / maxOrificeArea));

  // Capacity at selected orifice
  const capacityAtOrifice = requiredArea > 0
    ? requiredCapacity * (selectedOrifice.area / requiredArea)
    : 0;

  const percentUtilized = selectedOrifice.area > 0
    ? (requiredArea / selectedOrifice.area) * 100
    : 0;

  return {
    requiredArea: roundTo(requiredArea, 2),
    selectedOrifice: selectedOrifice.letter,
    orificeArea: selectedOrifice.area,
    relievingPressure: roundTo(relievingPressure, 2),
    capacityAtOrifice: roundTo(capacityAtOrifice, 2),
    percentUtilized: roundTo(percentUtilized, 2),
    orificeExceedsMax,
    suggestedMinValves,
  };
}
