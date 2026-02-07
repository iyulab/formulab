import { roundTo } from '../utils.js';
import type { ArcFlashInput, ArcFlashResult } from './types.js';

/**
 * Arc Flash Incident Energy Calculator — IEEE 1584-2018 Simplified / NFPA 70E
 *
 * @formula
 *   - Ia (arcing current) from empirical IEEE 1584 equations
 *   - E (incident energy) = Cf × normalized energy × (t/0.2) × (610^x / D^x)
 *   - AFB = distance where E = 1.2 cal/cm²
 *
 * @reference IEEE 1584-2018 — Guide for Performing Arc-Flash Hazard Calculations
 * @reference NFPA 70E-2024 — Standard for Electrical Safety in the Workplace
 */
export function arcFlash(input: ArcFlashInput): ArcFlashResult {
  const { voltage, boltedFaultCurrent, workingDistance, faultClearingTime, gapBetweenConductors, enclosureType } = input;

  const Ibf = boltedFaultCurrent; // kA
  const V = voltage;
  const G = gapBetweenConductors; // mm
  const t = faultClearingTime; // seconds
  const D = workingDistance; // mm

  // Enclosure correction factors
  const enclosureCf: Record<string, number> = {
    open: 1.0,
    box: 1.5,
    mcc: 1.5,
    panel: 1.5,
    cable: 1.0,
  };
  const Cf = enclosureCf[enclosureType] ?? 1.0;

  // Distance exponents by voltage
  const distanceExponent = V <= 1000 ? 1.641 : 0.973;

  // Arcing current estimation (simplified IEEE 1584)
  let Ia: number;
  if (V <= 1000) {
    // Low voltage
    const logIa = 0.662 * Math.log10(Ibf) + 0.0966 * (V / 1000) + 0.000526 * G + 0.5588 * (V / 1000) * Math.log10(Ibf) - 0.00304 * G * Math.log10(Ibf);
    Ia = Math.pow(10, logIa);
  } else {
    // Medium voltage (> 1kV)
    const logIa = 0.00402 + 0.983 * Math.log10(Ibf);
    Ia = Math.pow(10, logIa);
  }

  // Normalized incident energy at 610mm, 0.2s (cal/cm²)
  const K1 = enclosureType === 'open' ? -0.792 : -0.555;
  const K2 = 0; // ungrounded/HRG → -0.113, but default grounded
  const logEn = K1 + K2 + 1.081 * Math.log10(Ia) + 0.0011 * G;
  const En = Math.pow(10, logEn);

  // Incident energy at working distance
  const E = Cf * En * (t / 0.2) * Math.pow(610, distanceExponent) / Math.pow(D, distanceExponent);

  // Arc flash boundary (distance where E = 1.2 cal/cm²)
  const Eb = 1.2; // cal/cm² threshold
  const AFB = Math.pow((Cf * En * (t / 0.2) * Math.pow(610, distanceExponent)) / Eb, 1 / distanceExponent);

  // PPE Category per NFPA 70E Table 130.7(C)(15)(a)
  let ppeCategory: ArcFlashResult['ppeCategory'];
  if (E <= 1.2) ppeCategory = 0;
  else if (E <= 4) ppeCategory = 1;
  else if (E <= 8) ppeCategory = 2;
  else if (E <= 25) ppeCategory = 3;
  else ppeCategory = 4;

  // Hazard level
  let hazardLevel: ArcFlashResult['hazardLevel'];
  if (E <= 1.2) hazardLevel = 'safe';
  else if (E <= 40) hazardLevel = 'danger';
  else hazardLevel = 'extreme';

  // Required PPE description
  const ppeDescriptions: Record<number, string> = {
    0: 'No PPE required (E ≤ 1.2 cal/cm²)',
    1: 'Arc-rated shirt, pants, safety glasses (4 cal/cm²)',
    2: 'Arc flash suit or arc-rated clothing (8 cal/cm²)',
    3: 'Arc flash suit, gloves, face shield (25 cal/cm²)',
    4: 'Arc flash suit rated > 25 cal/cm² (40 cal/cm²)',
  };

  return {
    arcCurrent: roundTo(Ia, 2),
    incidentEnergy: roundTo(E, 2),
    arcFlashBoundary: roundTo(AFB, 0),
    ppeCategory,
    hazardLevel,
    requiredPPE: ppeDescriptions[ppeCategory],
  };
}
