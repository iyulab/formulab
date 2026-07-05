import type {
  NioshInput,
  NioshResult,
  WorkDuration,
  CouplingQuality,
} from './types.js';

// NIOSH Lifting Equation constants
const LC = 23; // Load Constant in kg

// Frequency Multiplier (FM) lookup table — NIOSH 94-110 Table 5
// Each cell is [FM for V < 75cm, FM for V >= 75cm]; 0 means no weight is acceptable.
const FM_TABLE: Record<WorkDuration, Record<string, [number, number]>> = {
  short: {
    '0.2': [1.0, 1.0],
    '0.5': [0.97, 0.97],
    '1': [0.94, 0.94],
    '2': [0.91, 0.91],
    '3': [0.88, 0.88],
    '4': [0.84, 0.84],
    '5': [0.8, 0.8],
    '6': [0.75, 0.75],
    '7': [0.7, 0.7],
    '8': [0.6, 0.6],
    '9': [0.52, 0.52],
    '10': [0.45, 0.45],
    '11': [0.41, 0.41],
    '12': [0.37, 0.37],
    '13': [0.0, 0.34],
    '14': [0.0, 0.31],
    '15': [0.0, 0.28],
  },
  medium: {
    '0.2': [0.95, 0.95],
    '0.5': [0.92, 0.92],
    '1': [0.88, 0.88],
    '2': [0.84, 0.84],
    '3': [0.79, 0.79],
    '4': [0.72, 0.72],
    '5': [0.6, 0.6],
    '6': [0.5, 0.5],
    '7': [0.42, 0.42],
    '8': [0.35, 0.35],
    '9': [0.3, 0.3],
    '10': [0.26, 0.26],
    '11': [0.0, 0.23],
    '12': [0.0, 0.21],
    '13': [0.0, 0.0],
    '14': [0.0, 0.0],
    '15': [0.0, 0.0],
  },
  long: {
    '0.2': [0.85, 0.85],
    '0.5': [0.81, 0.81],
    '1': [0.75, 0.75],
    '2': [0.65, 0.65],
    '3': [0.55, 0.55],
    '4': [0.45, 0.45],
    '5': [0.35, 0.35],
    '6': [0.27, 0.27],
    '7': [0.22, 0.22],
    '8': [0.18, 0.18],
    '9': [0.0, 0.15],
    '10': [0.0, 0.13],
    '11': [0.0, 0.0],
    '12': [0.0, 0.0],
    '13': [0.0, 0.0],
    '14': [0.0, 0.0],
    '15': [0.0, 0.0],
  },
};

// Coupling Multiplier (CM) lookup table — NIOSH 94-110 Table 7
// low = V < 75cm, high = V >= 75cm
const CM_TABLE: Record<CouplingQuality, { low: number; high: number }> = {
  good: { low: 1.0, high: 1.0 },
  fair: { low: 0.95, high: 1.0 },
  poor: { low: 0.9, high: 0.9 },
};

/**
 * Get frequency multiplier (FM) based on frequency, duration, and vertical position
 */
function getFrequencyMultiplier(
  frequency: number,
  duration: WorkDuration,
  verticalDistance: number
): number {
  const table = FM_TABLE[duration];
  const keys = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);

  // Above the table's maximum frequency, no weight is acceptable (NIOSH: > 15 → FM 0)
  if (frequency > keys[keys.length - 1]) {
    return 0;
  }

  // Find the closest frequency key at or below the given frequency
  let closestKey = keys[0];
  for (const key of keys) {
    if (key <= frequency) {
      closestKey = key;
    } else {
      break;
    }
  }

  const [lowV, highV] = table[String(closestKey)];
  return verticalDistance < 75 ? lowV : highV;
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
 * @throws {RangeError} any distance, angle, frequency, or loadWeight is negative.
 * @remarks Distances below the equation's domain (H, D < 25 cm) are clamped per the
 *   NIOSH spec rather than rejected. When the frequency multiplier drives RWL to 0
 *   (sustained high-frequency lifting), liftingIndex is Infinity — an intentional
 *   sentinel meaning "no weight is acceptable for this task".
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

  if (
    horizontalDistance < 0 ||
    verticalDistance < 0 ||
    verticalTravel < 0 ||
    asymmetryAngle < 0 ||
    frequency < 0 ||
    loadWeight < 0
  ) {
    throw new RangeError('distances, asymmetryAngle, frequency, and loadWeight must not be negative');
  }

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

  // FM: Frequency Multiplier (from lookup table, V-dependent at high frequencies)
  const fm = getFrequencyMultiplier(frequency, duration, verticalDistance);

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
