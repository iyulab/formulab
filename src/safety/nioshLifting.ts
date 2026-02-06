import type {
  NioshInput,
  NioshResult,
  WorkDuration,
  CouplingQuality,
} from './types.js';

// NIOSH Lifting Equation constants
const LC = 23; // Load Constant in kg

// Frequency Multiplier (FM) lookup table
// Based on NIOSH 1991 Revised Lifting Equation
const FM_TABLE: Record<WorkDuration, Record<string, number>> = {
  short: {
    '0.2': 1.0,
    '0.5': 0.97,
    '1': 0.94,
    '2': 0.91,
    '3': 0.88,
    '4': 0.84,
    '5': 0.8,
    '6': 0.75,
    '7': 0.7,
    '8': 0.6,
    '9': 0.52,
    '10': 0.45,
    '11': 0.41,
    '12': 0.37,
    '13': 0.34,
    '14': 0.31,
    '15': 0.28,
  },
  medium: {
    '0.2': 0.95,
    '0.5': 0.92,
    '1': 0.88,
    '2': 0.84,
    '3': 0.79,
    '4': 0.72,
    '5': 0.6,
    '6': 0.5,
    '7': 0.42,
    '8': 0.35,
    '9': 0.3,
    '10': 0.26,
    '11': 0.23,
    '12': 0.21,
    '13': 0.19,
    '14': 0.17,
    '15': 0.15,
  },
  long: {
    '0.2': 0.85,
    '0.5': 0.81,
    '1': 0.75,
    '2': 0.65,
    '3': 0.55,
    '4': 0.45,
    '5': 0.35,
    '6': 0.27,
    '7': 0.22,
    '8': 0.18,
    '9': 0.15,
    '10': 0.13,
    '11': 0.11,
    '12': 0.1,
    '13': 0.0,
    '14': 0.0,
    '15': 0.0,
  },
};

// Coupling Multiplier (CM) lookup table
// V < 75cm and V >= 75cm
const CM_TABLE: Record<CouplingQuality, { low: number; high: number }> = {
  good: { low: 1.0, high: 1.0 },
  fair: { low: 1.0, high: 0.95 },
  poor: { low: 0.9, high: 0.9 },
};

/**
 * Get frequency multiplier (FM) based on frequency and duration
 */
function getFrequencyMultiplier(
  frequency: number,
  duration: WorkDuration
): number {
  const table = FM_TABLE[duration];
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);

  // Find the closest frequency key
  let closestKey = keys[0];
  for (const key of keys) {
    if (key <= frequency) {
      closestKey = key;
    } else {
      break;
    }
  }

  // If frequency exceeds max, use last value
  if (frequency > keys[keys.length - 1]) {
    closestKey = keys[keys.length - 1];
  }

  return table[String(closestKey)];
}

/**
 * Get coupling multiplier (CM) based on coupling quality and vertical position
 */
function getCouplingMultiplier(
  coupling: CouplingQuality,
  verticalDistance: number
): number {
  const cmValues = CM_TABLE[coupling];
  return verticalDistance < 75 ? cmValues.low : cmValues.high;
}

/**
 * Calculate NIOSH Recommended Weight Limit (RWL) and Lifting Index (LI)
 *
 * @formula RWL = LC × HM × VM × DM × AM × FM × CM
 *   - LC  = 23 kg (Load Constant)
 *   - HM  = 25 / H  (Horizontal Multiplier, max 1.0)
 *   - VM  = 1 − 0.003|V − 75|  (Vertical Multiplier)
 *   - DM  = 0.82 + 4.5 / D  (Distance Multiplier, D ≥ 25 cm)
 *   - AM  = 1 − 0.0032A  (Asymmetric Multiplier)
 *   - FM  = lookup(frequency, duration)
 *   - CM  = lookup(coupling, V)
 *   - LI  = Load Weight / RWL
 *
 * @reference NIOSH (1994). "Applications Manual for the Revised NIOSH Lifting Equation",
 *   Publication No. 94-110. U.S. Dept. of Health and Human Services.
 * @reference Waters, T.R., Putz-Anderson, V., Garg, A. (1993). "Revised NIOSH equation
 *   for the design and evaluation of manual lifting tasks". Ergonomics, 36(7), 749-776.
 *
 * @units H, V, D: cm; A: degrees; frequency: lifts/min; loadWeight: kg; RWL: kg
 *
 * @validation
 *   - Ideal conditions (all multipliers = 1.0): RWL = LC = 23 kg
 *   - Risk: low (LI ≤ 1), moderate (1 < LI ≤ 2), high (LI > 2)
 *
 * @param input - NIOSH lifting parameters
 * @returns NIOSH results including RWL, LI, multipliers, and risk level
 */
export function nioshLifting(input: NioshInput): NioshResult {
  const {
    horizontalDistance,
    verticalDistance,
    verticalTravel,
    asymmetryAngle,
    frequency,
    duration,
    coupling,
    loadWeight,
  } = input;

  // Calculate multipliers
  // HM: Horizontal Multiplier (25/H), max 1.0, H must be >= 25cm
  const h = Math.max(horizontalDistance, 25);
  const hm = Math.min(25 / h, 1.0);

  // VM: Vertical Multiplier (1 - 0.003|V - 75|), V in cm
  const vm = Math.max(0, 1 - 0.003 * Math.abs(verticalDistance - 75));

  // DM: Distance Multiplier (0.82 + 4.5/D), D must be >= 25cm
  const d = Math.max(verticalTravel, 25);
  const dm = Math.min(0.82 + 4.5 / d, 1.0);

  // AM: Asymmetric Multiplier (1 - 0.0032A), A in degrees
  const am = Math.max(0, 1 - 0.0032 * asymmetryAngle);

  // FM: Frequency Multiplier (from lookup table)
  const fm = getFrequencyMultiplier(frequency, duration);

  // CM: Coupling Multiplier (from lookup table)
  const cm = getCouplingMultiplier(coupling, verticalDistance);

  // Calculate RWL
  const rwl = LC * hm * vm * dm * am * fm * cm;

  // Calculate Lifting Index
  const liftingIndex = rwl > 0 ? loadWeight / rwl : Infinity;

  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high';
  if (liftingIndex <= 1) {
    riskLevel = 'low';
  } else if (liftingIndex <= 2) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'high';
  }

  return {
    rwl,
    liftingIndex,
    hm,
    vm,
    dm,
    am,
    fm,
    cm,
    riskLevel,
  };
}
