import type { WeldHeatInput, WeldHeatResult, WeldProcess, WeldBaseMetal, CrackingRisk } from './types.js';

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

/** Preheat temperature by CE and thickness */
function getPreheatTemp(ce: number, thickness: number): { min: number; max: number } {
  // Simplified preheat calculation based on CE and thickness
  let baseTemp = 20; // ambient

  if (ce > 0.60) baseTemp = 200;
  else if (ce > 0.50) baseTemp = 150;
  else if (ce > 0.45) baseTemp = 100;
  else if (ce > 0.40) baseTemp = 75;

  // Thickness adjustment
  if (thickness > 50) baseTemp += 50;
  else if (thickness > 25) baseTemp += 25;

  return {
    min: Math.max(20, baseTemp - 25),
    max: baseTemp + 25,
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
 * Calculate welding heat input and preheating requirements.
 */
export function weldHeat(input: WeldHeatInput): WeldHeatResult {
  const { process, voltage, current, travelSpeed, baseMetal, thickness } = input;

  // Validation
  if (voltage <= 0 || current <= 0 || travelSpeed <= 0 || thickness <= 0) {
    return {
      heatInput: 0,
      efficiency: WELD_EFFICIENCY[process],
      carbonEquivalent: 0,
      preheatTemp: { min: 20, max: 20 },
      interpassTemp: { min: 20, max: 250 },
      hazHardnessMax: 0,
      crackingRisk: 'low',
      recommendations: [],
    };
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

  // Carbon Equivalent (IIW formula)
  // CE = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15
  const carbonEquivalent = C + Mn / 6 + (Cr + Mo + V) / 5 + (Ni + Cu) / 15;

  // Determine cracking risk
  let crackingRisk: CrackingRisk;
  if (carbonEquivalent <= 0.40) crackingRisk = 'low';
  else if (carbonEquivalent <= 0.45) crackingRisk = 'moderate';
  else if (carbonEquivalent <= 0.60) crackingRisk = 'high';
  else crackingRisk = 'veryHigh';

  // Get preheat and interpass temperatures
  const preheatTemp = getPreheatTemp(carbonEquivalent, thickness);
  const interpassTemp = getInterpassTemp(baseMetal);

  // Estimate maximum HAZ hardness (simplified Yurioka formula approximation)
  // HV_max ≈ 90 + 1050xC + 47xMn + 31xCr + 34xMo + 38xV + 12xNi
  // This is a rough approximation
  const hazHardnessMax = Math.min(600, Math.round(
    90 + 1050 * C + 47 * Mn + 31 * Cr + 34 * Mo + 38 * V + 12 * Ni
  ));

  // Generate recommendations
  const recommendations: string[] = [];

  if (preheatTemp.min > 20) {
    recommendations.push(`Preheat to ${preheatTemp.min}-${preheatTemp.max}°C before welding`);
  }

  if (heatInput < 0.5) {
    recommendations.push('Consider increasing heat input to reduce cooling rate');
  } else if (heatInput > 2.5) {
    recommendations.push('Consider reducing heat input to minimize HAZ width');
  }

  if (crackingRisk === 'high' || crackingRisk === 'veryHigh') {
    recommendations.push('Use low-hydrogen electrodes or processes');
    recommendations.push('Consider post-weld heat treatment (PWHT)');
  }

  if (hazHardnessMax > 350) {
    recommendations.push('High HAZ hardness expected - control cooling rate');
  }

  if (baseMetal === 'stainlessSteel') {
    recommendations.push('Maintain low interpass temperature to prevent sensitization');
  }

  if (baseMetal === 'castIron') {
    recommendations.push('Use nickel-based filler metals');
    recommendations.push('Peen weld passes while hot to relieve stress');
  }

  return {
    heatInput: roundTo(heatInput, 2),
    efficiency,
    carbonEquivalent: roundTo(carbonEquivalent, 2),
    preheatTemp,
    interpassTemp,
    hazHardnessMax,
    crackingRisk,
    recommendations,
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
