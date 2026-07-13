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
 * Relief Valve Sizing — API 520 Simplified
 *
 * @formula
 *   - Gas: A = W / (C × Kd × P1 × Kb × Kc) × √(T×Z / M)
 *   - Liquid: A = Q / (Kd × Kw × Kc) × √(SG / ΔP)
 *   - Standard orifice selection per API 526
 *
 * @reference API 520 Part I (2020) — Sizing and Selection of Pressure-Relieving Devices
 * @reference API 526 (2017) — Flanged Steel Pressure-Relief Valves
 *
 * When the required area exceeds the largest API 526 orifice ('T', 16,774 mm²), the result
 * still reports 'T' as the closest standard size but sets `orificeExceedsMax: true` — a single
 * valve cannot provide the required capacity (multiple valves in parallel are needed). Callers
 * should surface this to the user; `percentUtilized` will be > 100 in that case.
 * `suggestedMinValves` gives the first-order parallel count (`ceil(requiredArea / T)`); an
 * actual multi-valve installation must be re-sized per API 520, since inlet and back-pressure
 * corrections change each valve's capacity.
 */
export function reliefValve(input: ReliefValveInput): ReliefValveResult {
  const {
    requiredCapacity, setPressure, backPressure, temperature, fluidType,
    molecularWeight = 29, specificGravity = 1.0,
    overpressure = 10, dischargeCoefficient,
  } = input;

  // Atmospheric pressure
  const patm = 101.325; // kPa
  const P1 = setPressure + patm + (setPressure * overpressure / 100); // kPa absolute (relieving)
  const relievingPressure = P1;

  let requiredArea: number; // mm²

  if (fluidType === 'gas' || fluidType === 'steam') {
    const Kd = dischargeCoefficient ?? 0.975;
    const Kb = 1.0; // Back pressure correction (conventional, balanced assumed)
    const Kc = 1.0; // Combination correction
    const T = temperature + 273.15;
    const Z = 1.0; // Compressibility factor
    const M = molecularWeight;

    // C = coefficient depending on ratio of specific heats (k)
    // For k=1.4: C ≈ 356
    const k = fluidType === 'steam' ? 1.3 : 1.4;
    const C = 520 * Math.sqrt(k * Math.pow(2 / (k + 1), (k + 1) / (k - 1)));

    // W in kg/h, P1 in kPa, T in K, M in g/mol
    // A (mm²) = W × √(T×Z/M) / (C × Kd × P1 × Kb × Kc) × 1e6 (unit conversion)
    const numerator = requiredCapacity * Math.sqrt(T * Z / M);
    const denominator = C * Kd * (P1 / 100) * Kb * Kc; // P1 in bar for formula

    requiredArea = (numerator / denominator) * 1e3; // convert to mm²

  } else {
    // Liquid
    const Kd = dischargeCoefficient ?? 0.65;
    const Kw = 1.0; // Back pressure correction
    const Kc = 1.0;
    const Kv = 1.0; // Viscosity correction

    const dp = P1 - (backPressure + patm); // kPa
    const SG = specificGravity;

    if (dp <= 0) {
      requiredArea = 0;
    } else {
      // Q = W / (ρ × 3600) → m³/s, convert to m³/h
      // A (mm²) = Q_m³h / (Kd × Kw × Kc × Kv) × √(SG/dp_bar) × conversion
      const rho = SG * 999; // kg/m³
      const Qm3h = requiredCapacity / rho;
      const dpBar = dp / 100;

      requiredArea = (Qm3h / (Kd * Kw * Kc * Kv)) * Math.sqrt(SG / dpBar) * 1e4 / 3.6;
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
