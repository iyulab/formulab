import { roundTo } from '../utils.js';
import type { ArcFlashInput, ArcFlashResult, ArcFlashEquipment } from './types.js';

/** IEEE 1584-2002 model range (clause 4) — the empirical equations were fitted only inside it. */
const VOLTAGE_RANGE = { min: 208, max: 15000 } as const; // V
const BOLTED_FAULT_RANGE = { min: 0.7, max: 106 } as const; // kA
const GAP_RANGE = { min: 13, max: 152 } as const; // mm

/**
 * Distance exponent x — IEEE 1584-2002 Table 4 ("Factors for equipment and voltage classes").
 * The table gives no MCC/panel row above 1 kV, so those combinations are outside the model.
 */
const DISTANCE_EXPONENT: Record<ArcFlashEquipment, { low: number; medium: number | null }> = {
  open: { low: 2.0, medium: 2.0 },
  switchgear: { low: 1.473, medium: 0.973 },
  mcc: { low: 1.641, medium: null },
  panel: { low: 1.641, medium: null },
  cable: { low: 2.0, medium: 2.0 },
};

/**
 * Open configuration = no enclosure (open air, cable); box configuration = enclosed equipment.
 * This selects K (arcing current) and K1 (normalized incident energy).
 */
const ENCLOSED: Record<ArcFlashEquipment, boolean> = {
  open: false,
  switchgear: true,
  mcc: true,
  panel: true,
  cable: false,
};

/**
 * Arc Flash Incident Energy — IEEE 1584-2002 empirical model, PPE category per NFPA 70E
 *
 * @formula
 *   - Arcing current, V ≤ 1 kV:
 *     lg Ia = K + 0.662 lg Ibf + 0.0966 V + 0.000526 G + 0.5588 V lg Ibf − 0.00304 G lg Ibf
 *     (K = −0.153 open, −0.097 box; V in kV)
 *   - Arcing current, 1 kV < V ≤ 15 kV: lg Ia = 0.00402 + 0.983 lg Ibf
 *   - Normalized energy (610 mm, 0.2 s): lg En = K1 + K2 + 1.081 lg Ia + 0.0011 G
 *     (K1 = −0.792 open, −0.555 box; K2 = 0 ungrounded/high-resistance grounded, −0.113 grounded)
 *   - Incident energy: E = Cf × En × (t / 0.2) × (610 / D)^x  [cal/cm²]
 *     (Cf = 1.5 for V ≤ 1 kV, 1.0 above; x from Table 4 by equipment and voltage class)
 *   - Arc flash boundary: DB = [Cf × En × (t / 0.2) × 610^x / 1.2]^(1/x)  [mm, at 1.2 cal/cm²]
 *   - For V ≤ 1 kV the guide also requires a second evaluation at 85 % of Ia; `reducedArcCurrent`
 *     is that current, for reading the protective device's clearing time.
 *
 * @reference IEEE 1584-2002 — Guide for Performing Arc Flash Hazard Calculations, clause 5, Table 4
 * @reference NFPA 70E — PPE categories by incident energy
 * @validation J. Phillips, "Arc Flash Calculation Guide" (Brainfiller), IEEE 1584-2002 worked
 *   example: 480 V, 30 kA, 25 mm panel, grounded, 1 cycle, 457.2 mm → Ia 16.761 kA,
 *   En 4.82, E 0.969 cal/cm² (4.05 J/cm²) — reproduced to the published digits
 *
 * @throws {RangeError} a non-positive input; voltage outside 208–15 000 V, bolted fault current
 *   outside 0.7–106 kA or gap outside 13–152 mm (the model's fitted range); MCC or panel above 1 kV
 *   (no distance exponent in Table 4)
 */
export function arcFlash(input: ArcFlashInput): ArcFlashResult {
  const { voltage, boltedFaultCurrent, workingDistance, faultClearingTime, gapBetweenConductors, equipment, grounding } = input;

  if (voltage <= 0) throw new RangeError('voltage must be greater than 0');
  if (boltedFaultCurrent <= 0) throw new RangeError('boltedFaultCurrent must be greater than 0');
  if (workingDistance <= 0) throw new RangeError('workingDistance must be greater than 0');
  if (faultClearingTime <= 0) throw new RangeError('faultClearingTime must be greater than 0');
  if (gapBetweenConductors <= 0) throw new RangeError('gapBetweenConductors must be greater than 0');
  if (voltage < VOLTAGE_RANGE.min || voltage > VOLTAGE_RANGE.max) {
    throw new RangeError(`voltage must be within ${VOLTAGE_RANGE.min}–${VOLTAGE_RANGE.max} V (IEEE 1584-2002 model range)`);
  }
  if (boltedFaultCurrent < BOLTED_FAULT_RANGE.min || boltedFaultCurrent > BOLTED_FAULT_RANGE.max) {
    throw new RangeError(`boltedFaultCurrent must be within ${BOLTED_FAULT_RANGE.min}–${BOLTED_FAULT_RANGE.max} kA (IEEE 1584-2002 model range)`);
  }
  if (gapBetweenConductors < GAP_RANGE.min || gapBetweenConductors > GAP_RANGE.max) {
    throw new RangeError(`gapBetweenConductors must be within ${GAP_RANGE.min}–${GAP_RANGE.max} mm (IEEE 1584-2002 model range)`);
  }

  const lowVoltage = voltage <= 1000;
  const x = lowVoltage ? DISTANCE_EXPONENT[equipment].low : DISTANCE_EXPONENT[equipment].medium;
  if (x === null) {
    throw new RangeError(`equipment '${equipment}' has no distance exponent above 1 kV in IEEE 1584-2002 Table 4`);
  }

  const V = voltage / 1000; // kV
  const G = gapBetweenConductors; // mm
  const t = faultClearingTime; // s
  const D = workingDistance; // mm
  const lgIbf = Math.log10(boltedFaultCurrent);
  const enclosed = ENCLOSED[equipment];

  const K = enclosed ? -0.097 : -0.153;
  const lgIa = lowVoltage
    ? K + 0.662 * lgIbf + 0.0966 * V + 0.000526 * G + 0.5588 * V * lgIbf - 0.00304 * G * lgIbf
    : 0.00402 + 0.983 * lgIbf;
  const Ia = Math.pow(10, lgIa);

  const K1 = enclosed ? -0.555 : -0.792;
  const K2 = grounding === 'grounded' ? -0.113 : 0;
  const En = Math.pow(10, K1 + K2 + 1.081 * Math.log10(Ia) + 0.0011 * G);

  const Cf = lowVoltage ? 1.5 : 1.0;
  const scaled = Cf * En * (t / 0.2);
  const E = scaled * Math.pow(610 / D, x);
  const AFB = Math.pow((scaled * Math.pow(610, x)) / 1.2, 1 / x);

  // PPE category per NFPA 70E incident-energy bands
  let ppeCategory: ArcFlashResult['ppeCategory'];
  if (E <= 1.2) ppeCategory = 0;
  else if (E <= 4) ppeCategory = 1;
  else if (E <= 8) ppeCategory = 2;
  else if (E <= 25) ppeCategory = 3;
  else ppeCategory = 4;

  let hazardLevel: ArcFlashResult['hazardLevel'];
  if (E <= 1.2) hazardLevel = 'safe';
  else if (E <= 40) hazardLevel = 'danger';
  else hazardLevel = 'extreme';

  const ppeDescriptions: Record<number, string> = {
    0: 'No PPE required (E ≤ 1.2 cal/cm²)',
    1: 'Arc-rated shirt, pants, safety glasses (4 cal/cm²)',
    2: 'Arc flash suit or arc-rated clothing (8 cal/cm²)',
    3: 'Arc flash suit, gloves, face shield (25 cal/cm²)',
    4: 'Arc flash suit rated > 25 cal/cm² (40 cal/cm²)',
  };

  return {
    arcCurrent: roundTo(Ia, 3),
    ...(lowVoltage ? { reducedArcCurrent: roundTo(0.85 * Ia, 3) } : {}),
    normalizedIncidentEnergy: roundTo(En, 3),
    incidentEnergy: roundTo(E, 2),
    arcFlashBoundary: roundTo(AFB, 0),
    distanceExponent: x,
    ppeCategory,
    hazardLevel,
    requiredPPE: ppeDescriptions[ppeCategory],
    standard: 'IEEE 1584-2002',
  };
}
