import { roundTo } from '../utils.js';
import type {
  WeldHeatInput,
  WeldHeatResult,
  WeldProcess,
  WeldBaseMetal,
  CrackingRisk,
  WeldPreheatSourceCode,
  WeldRecommendation,
} from './types.js';

/** Arc efficiency by welding process */
const WELD_EFFICIENCY: Record<WeldProcess, number> = {
  smaw: 0.72,  // Shielded Metal Arc Welding
  gmaw: 0.85,  // Gas Metal Arc Welding (MIG/MAG)
  gtaw: 0.58,  // Gas Tungsten Arc Welding (TIG)
  saw: 0.90,   // Submerged Arc Welding
};

/** Typical carbon content by base metal */
const TYPICAL_COMPOSITION: Record<WeldBaseMetal, {
  C: number; Mn: number; Cr: number; Mo: number; V: number; Ni: number; Cu: number; Si: number;
}> = {
  mildSteel: { C: 0.15, Mn: 0.60, Cr: 0, Mo: 0, V: 0, Ni: 0, Cu: 0, Si: 0.20 },
  lowAlloySteel: { C: 0.20, Mn: 1.00, Cr: 0.50, Mo: 0.25, V: 0.05, Ni: 0.50, Cu: 0, Si: 0.30 },
  stainlessSteel: { C: 0.08, Mn: 2.00, Cr: 18.0, Mo: 2.5, V: 0, Ni: 10.0, Cu: 0, Si: 1.00 },
  castIron: { C: 3.50, Mn: 0.50, Cr: 0, Mo: 0, V: 0, Ni: 0, Cu: 0, Si: 2.00 },
};

/**
 * AWS D1.1:2020 Table 5.8 / EN 1011-2 Preheat Requirements
 * Based on Carbon Equivalent (CE) and combined thickness
 * Returns preheat temperature based on interaction of CE and thickness
 */
function getPreheatTempAWS(ce: number, thickness: number, heatInput: number): { min: number; max: number; source: string; sourceCode: WeldPreheatSourceCode } {
  // AWS D1.1 Table 5.8 preheat requirements (simplified)
  // Uses combined CE (IIW) and governing thickness

  // Heat input factor - higher heat input allows lower preheat
  const heatInputFactor = heatInput >= 1.5 ? -25 : heatInput >= 1.0 ? 0 : 25;

  let baseTemp = 20; // ambient
  let source = 'AWS D1.1 Table 5.8';
  let sourceCode: WeldPreheatSourceCode = 'awsTable';

  // CE and thickness interaction matrix (AWS D1.1 / EN 1011-2 basis)
  if (ce <= 0.30) {
    // Low CE - preheat mainly thickness dependent
    if (thickness > 50) baseTemp = 50;
    else if (thickness > 25) baseTemp = 20;
    else baseTemp = 20;
  } else if (ce <= 0.40) {
    // Moderate CE
    if (thickness > 75) baseTemp = 150;
    else if (thickness > 50) baseTemp = 100;
    else if (thickness > 25) baseTemp = 50;
    else baseTemp = 20;
  } else if (ce <= 0.45) {
    // Moderate-high CE
    if (thickness > 75) baseTemp = 200;
    else if (thickness > 50) baseTemp = 150;
    else if (thickness > 25) baseTemp = 100;
    else if (thickness > 12) baseTemp = 75;
    else baseTemp = 50;
  } else if (ce <= 0.50) {
    // High CE
    if (thickness > 75) baseTemp = 225;
    else if (thickness > 50) baseTemp = 175;
    else if (thickness > 25) baseTemp = 125;
    else if (thickness > 12) baseTemp = 100;
    else baseTemp = 75;
  } else if (ce <= 0.60) {
    // Very high CE
    if (thickness > 50) baseTemp = 250;
    else if (thickness > 25) baseTemp = 200;
    else if (thickness > 12) baseTemp = 150;
    else baseTemp = 125;
    source = 'AWS D1.1 + Engineering judgment';
    sourceCode = 'awsJudgment';
  } else {
    // Extremely high CE - requires special procedures
    baseTemp = 250 + Math.min(50, (ce - 0.60) * 200);
    source = 'Engineering judgment - consult welding engineer';
    sourceCode = 'engineeringJudgment';
  }

  // Apply heat input adjustment
  baseTemp = Math.max(20, baseTemp + heatInputFactor);

  return {
    min: Math.max(20, baseTemp - 25),
    max: Math.min(350, baseTemp + 25),
    source,
    sourceCode,
  };
}

/** Interpass temperature limits */
function getInterpassTemp(baseMetal: WeldBaseMetal): { min: number; max: number } {
  switch (baseMetal) {
    case 'stainlessSteel':
      return { min: 20, max: 150 }; // Lower to prevent sensitization
    case 'castIron':
      return { min: 150, max: 300 }; // Keep warm
    default:
      return { min: 20, max: 250 };
  }
}

/**
 * Calculate cooling time t8/5 (time to cool from 800°C to 500°C)
 * Based on Rosenthal's equation for thick plate (2D heat flow)
 *
 * t8/5 = (4300 - 4.3×T₀) × 10⁵ × H² / ((500 - T₀)² - (800 - T₀)²) for t < 0.75×δ
 * t8/5 = (6700 - 5×T₀) × H / ((500 - T₀) - (800 - T₀)) for t ≥ 0.75×δ
 *
 * Simplified formula for practical use:
 * t8/5 ≈ K × H² / t² (thin plate) or K × H (thick plate)
 */
function calculateCoolingTime(
  heatInput: number, thickness: number, preheatTemp: number
): { value: number; clamped: boolean } {
  const T0 = preheatTemp;

  // Critical thickness for 2D/3D transition (approximately)
  const criticalThickness = 0.035 * Math.sqrt(heatInput * 1000); // mm

  let t85: number;

  if (thickness <= criticalThickness) {
    // Thin plate (2D heat flow) - Rosenthal thin plate
    // t8/5 = (4300 - 4.3×T₀) × 10⁵ × (H/1000)² / (t²) × [(1/(500-T₀)²) - (1/(800-T₀)²)]
    const factor = (4300 - 4.3 * T0) * 1e5;
    const tempTerm = 1 / Math.pow(500 - T0, 2) - 1 / Math.pow(800 - T0, 2);
    t85 = factor * Math.pow(heatInput, 2) * tempTerm / Math.pow(thickness, 2);
  } else {
    // Thick plate (3D heat flow) - Rosenthal thick plate
    // t8/5 = (6700 - 5×T₀) × (H/1000) × [(1/(500-T₀)) - (1/(800-T₀))]
    const factor = (6700 - 5 * T0);
    const tempTerm = 1 / (500 - T0) - 1 / (800 - T0);
    t85 = factor * heatInput * tempTerm;
  }

  // Clamp to the model's validity range (0.5s - 300s). Realistic inputs do land outside it
  // (thin-sheet GTAW at low heat input gives raw t8/5 ≈ 0.39s), so report the clamp — otherwise
  // varying thickness below the floor produces identical outputs with no explanation.
  const value = Math.max(0.5, Math.min(300, t85));
  return { value, clamped: value !== t85 };
}

/**
 * Calculate maximum HAZ hardness using Yurioka formula with cooling rate
 * HV_max = HV_base + ΔHV(t8/5)
 *
 * Full Yurioka formula considers:
 * - Base hardness from composition
 * - Cooling rate effect (faster cooling = higher hardness)
 */
function calculateHAZHardness(
  C: number, Mn: number, Cr: number, Mo: number, V: number, Ni: number, Si: number,
  coolingTime: number
): { value: number; clamped: boolean } {
  // Base hardness contribution from composition (Yurioka base)
  const HV_base = 90 + 1050 * C + 47 * Mn + 31 * Cr + 34 * Mo + 38 * V + 12 * Ni + 17 * Si;

  // Cooling rate factor (empirical adjustment)
  // Faster cooling (lower t8/5) increases hardness
  // Normalized to t8/5 = 15s as reference
  let coolingFactor = 1.0;
  if (coolingTime < 5) {
    coolingFactor = 1.3; // Very fast cooling - significant hardening
  } else if (coolingTime < 10) {
    coolingFactor = 1.2;
  } else if (coolingTime < 15) {
    coolingFactor = 1.1;
  } else if (coolingTime > 30) {
    coolingFactor = 0.9; // Slow cooling - less hardening
  }

  const HV_max = HV_base * coolingFactor;

  // Clamp to the Yurioka model's calibrated range (150-700 HV). Stainless and cast-iron
  // compositions push HV_base far past 700 (e.g. cast iron ≈ 4200), so a silent clamp renders
  // hardness flat across current/composition sweeps — report it so callers treat the value as
  // a bound, not a prediction.
  const value = Math.min(700, Math.max(150, roundTo(HV_max, 0)));
  return { value, clamped: value !== roundTo(HV_max, 0) };
}

/**
 * Calculate welding heat input, cooling time, and preheating requirements.
 * Implements AWS D1.1, EN 1011, and Yurioka methodologies.
 *
 * The result carries advice in two parallel forms: `recommendations` (English
 * sentences) and `recommendationCodes` (stable `{ code, params }` entries for
 * i18n). `preheatTemp.source` likewise has a stable `preheatTemp.sourceCode`.
 *
 * Both `coolingTime_t85` (model range 0.5-300 s) and `hazHardnessMax` (150-700 HV) are
 * clamped to their models' validity ranges; when that happens `coolingTimeClamped` /
 * `hazHardnessClamped` is set and the reported number is a boundary value, not a prediction
 * (at the 700 HV ceiling it is a lower bound — stainless and cast iron compositions hit it).
 *
 * @throws {RangeError} voltage, current, travelSpeed, or thickness is not positive
 */
export function weldHeat(input: WeldHeatInput): WeldHeatResult {
  const { process, voltage, current, travelSpeed, baseMetal, thickness } = input;

  // Validation
  if (voltage <= 0) {
    throw new RangeError('voltage must be greater than 0');
  }
  if (current <= 0) {
    throw new RangeError('current must be greater than 0');
  }
  if (travelSpeed <= 0) {
    throw new RangeError('travelSpeed must be greater than 0');
  }
  if (thickness <= 0) {
    throw new RangeError('thickness must be greater than 0');
  }

  const efficiency = WELD_EFFICIENCY[process];

  // Heat Input: H = (V x I x 60 x eta) / (S x 1000) kJ/mm
  const heatInput = (voltage * current * 60 * efficiency) / (travelSpeed * 1000);

  // Get composition (use input values or defaults)
  const defaultComp = TYPICAL_COMPOSITION[baseMetal];
  const C = input.carbon ?? defaultComp.C;
  const Mn = input.manganese ?? defaultComp.Mn;
  const Cr = input.chromium ?? defaultComp.Cr;
  const Mo = input.molybdenum ?? defaultComp.Mo;
  const V = input.vanadium ?? defaultComp.V;
  const Ni = input.nickel ?? defaultComp.Ni;
  const Cu = input.copper ?? defaultComp.Cu;
  const Si = input.silicon ?? defaultComp.Si;

  // Carbon Equivalent (IIW formula) - for steels with C > 0.18%
  // CE_IIW = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15
  const carbonEquivalent = C + Mn / 6 + (Cr + Mo + V) / 5 + (Ni + Cu) / 15;

  // Carbon Equivalent (Pcm formula) - for low-alloy steels with C < 0.18%
  // CE_Pcm = C + Si/30 + (Mn+Cu+Cr)/20 + Ni/60 + Mo/15 + V/10 + 5B
  const carbonEquivalentPcm = C + Si / 30 + (Mn + Cu + Cr) / 20 + Ni / 60 + Mo / 15 + V / 10;

  // Determine cracking risk based on both CE methods
  const effectiveCE = C < 0.18 ? carbonEquivalentPcm : carbonEquivalent;
  let crackingRisk: CrackingRisk;
  if (effectiveCE <= 0.35) crackingRisk = 'low';
  else if (effectiveCE <= 0.40) crackingRisk = 'moderate';
  else if (effectiveCE <= 0.50) crackingRisk = 'high';
  else crackingRisk = 'veryHigh';

  // Get preheat using AWS D1.1 method with CE and thickness interaction
  const preheatTemp = getPreheatTempAWS(carbonEquivalent, thickness, heatInput);
  const interpassTemp = getInterpassTemp(baseMetal);

  // Calculate cooling time t8/5
  const { value: coolingTime_t85, clamped: coolingTimeClamped } =
    calculateCoolingTime(heatInput, thickness, preheatTemp.min);
  const coolingRate = 300 / coolingTime_t85; // (800-500)/t8/5

  // Estimate maximum HAZ hardness with cooling rate consideration
  const { value: hazHardnessMax, clamped: hazHardnessClamped } =
    calculateHAZHardness(C, Mn, Cr, Mo, V, Ni, Si, coolingTime_t85);

  // Determine hydrogen control level required
  let hydrogenLevel: 'low' | 'medium' | 'high';
  if (carbonEquivalent > 0.50 || hazHardnessMax > 400 || crackingRisk === 'veryHigh') {
    hydrogenLevel = 'low'; // Must use low-hydrogen consumables
  } else if (carbonEquivalent > 0.40 || hazHardnessMax > 350 || crackingRisk === 'high') {
    hydrogenLevel = 'medium';
  } else {
    hydrogenLevel = 'high'; // Standard consumables acceptable
  }

  // Generate recommendations. `recommendations` holds human-readable English
  // sentences; `recommendationCodes` holds the parallel machine-readable form
  // (stable code + interpolation params) so consumers can localise the advice.
  const recommendations: string[] = [];
  const recommendationCodes: WeldRecommendation[] = [];
  const t85Rounded = roundTo(coolingTime_t85, 1);

  if (preheatTemp.min > 20) {
    recommendations.push(`Preheat to ${preheatTemp.min}-${preheatTemp.max}°C before welding (${preheatTemp.source})`);
    recommendationCodes.push({ code: 'preheat', params: { min: preheatTemp.min, max: preheatTemp.max, source: preheatTemp.sourceCode } });
  }

  if (coolingTime_t85 < 8) {
    recommendations.push(`Fast cooling (t8/5=${t85Rounded}s) - increase heat input or preheat to reduce cracking risk`);
    recommendationCodes.push({ code: 'fastCooling', params: { t85: t85Rounded } });
  } else if (coolingTime_t85 > 50) {
    recommendations.push(`Slow cooling (t8/5=${t85Rounded}s) - may result in reduced toughness`);
    recommendationCodes.push({ code: 'slowCooling', params: { t85: t85Rounded } });
  }

  if (heatInput < 0.5) {
    recommendations.push('Consider increasing heat input to reduce cooling rate');
    recommendationCodes.push({ code: 'increaseHeatInput', params: {} });
  } else if (heatInput > 3.0) {
    recommendations.push('High heat input may cause excessive grain growth in HAZ');
    recommendationCodes.push({ code: 'highHeatInput', params: {} });
  }

  if (hydrogenLevel === 'low') {
    recommendations.push('Use low-hydrogen electrodes (E7018, ER70S-6) or processes (GMAW, SAW)');
    recommendationCodes.push({ code: 'lowHydrogenConsumables', params: {} });
    recommendations.push('Maintain consumables dry per AWS A5.1 requirements');
    recommendationCodes.push({ code: 'keepConsumablesDry', params: {} });
  }

  if (crackingRisk === 'high' || crackingRisk === 'veryHigh') {
    recommendations.push('Consider post-weld heat treatment (PWHT) per AWS D1.1 Table 5.12');
    recommendationCodes.push({ code: 'pwht', params: {} });
  }

  if (hazHardnessClamped && hazHardnessMax === 700) {
    // Prediction exceeded the model ceiling — presenting "700 HV" as the expected value would
    // understate the risk (white cast iron HAZ genuinely exceeds 700 HV).
    recommendations.push('HAZ hardness prediction exceeds model ceiling (>700 HV) - treat value as a lower bound; control cooling rate and consider PWHT');
    recommendationCodes.push({ code: 'hazHardnessCapped', params: { cap: 700 } });
  } else if (hazHardnessMax > 350) {
    recommendations.push(`High HAZ hardness expected (${hazHardnessMax} HV) - control cooling rate and consider PWHT`);
    recommendationCodes.push({ code: 'highHazHardness', params: { hazHardnessMax } });
  }

  if (baseMetal === 'stainlessSteel') {
    recommendations.push('Maintain low interpass temperature (<150°C) to prevent sensitization');
    recommendationCodes.push({ code: 'stainlessInterpass', params: {} });
    recommendations.push('Use matching filler metal with controlled ferrite content');
    recommendationCodes.push({ code: 'stainlessFiller', params: {} });
  }

  if (baseMetal === 'castIron') {
    recommendations.push('Use nickel-based filler metals (ENiFe-CI, ENi-CI)');
    recommendationCodes.push({ code: 'castIronNiFiller', params: {} });
    recommendations.push('Peen weld passes while hot to relieve stress');
    recommendationCodes.push({ code: 'castIronPeen', params: {} });
    recommendations.push('Consider butter layers for thick sections');
    recommendationCodes.push({ code: 'castIronButter', params: {} });
  }

  return {
    heatInput: roundTo(heatInput, 2),
    efficiency,
    carbonEquivalent: roundTo(carbonEquivalent, 3),
    carbonEquivalentPcm: roundTo(carbonEquivalentPcm, 3),
    coolingTime_t85: roundTo(coolingTime_t85, 1),
    coolingTimeClamped,
    coolingRate: roundTo(coolingRate, 1),
    preheatTemp,
    interpassTemp,
    hazHardnessMax,
    hazHardnessClamped,
    crackingRisk,
    hydrogenLevel,
    recommendations,
    recommendationCodes,
  };
}
