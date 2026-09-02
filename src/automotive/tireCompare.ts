import { roundTo } from '../utils.js';
import type { TireInput, TireResult, TireData, TireSpec } from './types.js';

// Conversion constants
const INCHES_TO_MM = 25.4;

/**
 * ISO 4000-1 / ETRTO Load Index → maximum load per tire (kg), reference passenger-tire
 * inflation pressure. Covers LI 60-130 — motorcycle/compact-car through the heaviest
 * passenger-adjacent EV pickups (e.g. Rivian R1T, GMC Hummer EV run ~121-126 XL); the full
 * standard table continues to LI 279 for aircraft/mining-truck tires, out of scope for this
 * domain.
 *
 * SL (Standard Load), XL (Extra Load), and HL (High Load, ETRTO 2021 / US 2023) are NOT
 * separate tables — they are construction/reference-pressure classes that determine which LI a
 * given physical tire size can be rated at; the LI-to-kg mapping itself is universal across all
 * three. A "245/45R19 101Y XL" and a "245/45R19 101Y HL" of the same size both carry 825 kg per
 * this table — HL construction is what lets a manufacturer rate that size at LI 101 instead of a
 * lower XL-only rating, not a different number for the same LI.
 *
 * @reference ISO 4000-1 (Passenger car tyres — Part 1: Dimensions), reproduced via
 *   en.wikipedia.org/wiki/Tire_code "Load index and load range" table (cell-verified against
 *   this project's own extraction, 2026-09-02) and cross-checked at LI 70/91/98/100/101 against
 *   the UK Government MOT Inspection Manual Appendix B (gov.uk, single-wheel column, ÷2 —
 *   that table is a different reference-pressure class, but its ratios confirm this one) and
 *   published HL/XL comparison figures (Tire Review, "Continental Makes its First Tire with New
 *   HL Load Index": XL 98 = 750 kg, HL 101 = 825 kg — both match exactly).
 */
const TIRE_LOAD_INDEX_KG: Record<number, number> = {
  60: 250, 61: 257, 62: 265, 63: 272, 64: 280, 65: 290, 66: 300, 67: 307, 68: 315, 69: 325,
  70: 335, 71: 345, 72: 355, 73: 365, 74: 375, 75: 387, 76: 400, 77: 412, 78: 425, 79: 437,
  80: 450, 81: 462, 82: 475, 83: 487, 84: 500, 85: 515, 86: 530, 87: 545, 88: 560, 89: 580,
  90: 600, 91: 615, 92: 630, 93: 650, 94: 670, 95: 690, 96: 710, 97: 730, 98: 750, 99: 775,
  100: 800, 101: 825, 102: 850, 103: 875, 104: 900, 105: 925, 106: 950, 107: 975, 108: 1000,
  109: 1030, 110: 1060, 111: 1090, 112: 1120, 113: 1150, 114: 1180, 115: 1215, 116: 1250,
  117: 1285, 118: 1320, 119: 1360, 120: 1400, 121: 1450, 122: 1500, 123: 1550, 124: 1600,
  125: 1650, 126: 1700, 127: 1750, 128: 1800, 129: 1850, 130: 1900,
};

/**
 * Look up the maximum load per tire (kg) for a given ISO 4000-1 / ETRTO Load Index.
 *
 * @throws {RangeError} loadIndex is outside the supported 60-130 range
 */
export function tireLoadCapacityKg(loadIndex: number): number {
  const capacity = TIRE_LOAD_INDEX_KG[loadIndex];
  if (capacity == null) {
    throw new RangeError(`loadIndex must be an integer between 60 and 130 (got ${loadIndex})`);
  }
  return capacity;
}

/**
 * Calculate tire dimensions from tire specification
 *
 * Tire spec format: Width/Aspect Ratio R Rim
 * Example: 205/55R16 means 205mm width, 55% aspect ratio, 16" rim
 *
 * Formula:
 * - Sidewall height = Width x (Aspect / 100)
 * - Diameter = (Rim x 25.4) + (2 x Sidewall height)
 * - Circumference = Diameter x PI
 * - Revs per km = 1,000,000 / Circumference
 */
function calculateTireData(spec: TireSpec): TireData {
  const { width, aspect, rim, loadIndex } = spec;

  const sidewallHeight = width * (aspect / 100);
  const rimDiameterMm = rim * INCHES_TO_MM;
  const diameter = rimDiameterMm + (2 * sidewallHeight);
  const circumference = diameter * Math.PI;
  const revsPerKm = 1_000_000 / circumference;

  return {
    diameter: roundTo(diameter, 2),
    circumference: roundTo(circumference, 2),
    revsPerKm: roundTo(revsPerKm, 2),
    ...(loadIndex != null ? { maxLoadKg: tireLoadCapacityKg(loadIndex) } : {}),
  };
}

/**
 * Compare two tire sizes and calculate differences
 *
 * @param input - Two tire specifications to compare
 * @returns Comparison result with dimensions and differences
 */
export function tireCompare(input: TireInput): TireResult {
  const tire1Data = calculateTireData(input.tire1);
  const tire2Data = calculateTireData(input.tire2);

  const diameterDiff = tire2Data.diameter - tire1Data.diameter;
  const diameterDiffPercent = tire1Data.diameter > 0
    ? (diameterDiff / tire1Data.diameter) * 100
    : 0;

  // Speedometer correction: positive means speedo reads lower than actual
  // If tire2 is larger, actual speed is higher than displayed
  const speedoCorrection = -diameterDiffPercent;

  const bothHaveLoadIndex = tire1Data.maxLoadKg != null && tire2Data.maxLoadKg != null;
  const loadCapacityDiffKg = bothHaveLoadIndex
    ? roundTo(tire2Data.maxLoadKg! - tire1Data.maxLoadKg!, 2) || 0
    : undefined;

  // Use || 0 to convert -0 to 0 for cleaner output
  return {
    tire1: tire1Data,
    tire2: tire2Data,
    diameterDiff: roundTo(diameterDiff, 2) || 0,
    diameterDiffPercent: roundTo(diameterDiffPercent, 2) || 0,
    speedoCorrection: roundTo(speedoCorrection, 2) || 0,
    ...(bothHaveLoadIndex ? { loadCapacityDiffKg, loadCapacityReduced: loadCapacityDiffKg! < 0 } : {}),
  };
}
