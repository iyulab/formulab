import type { FlangeSpecInput, FlangeSpecResult, PressureClass } from './types.js';

interface FlangeDimension {
  od: number;                // flange OD, mm
  thickness: number;         // flange thickness, mm
  boltCircle: number;        // bolt circle diameter, mm
  boltHoles: number;         // number of bolt holes
  boltSize: string;          // bolt size
  raisedFace: number;        // raised face diameter, mm
  weight: number;            // approx weight, kg (WN flange)
}

/**
 * ASME B16.5 Welding Neck flange dimensions (raised face)
 *
 * Values are the published inch dimensions × 25.4, cross-checked 2026-09-15 against public B16.5 tables
 * that agree with each other (apiint.com · texasflange.com · wermac.org · zzsteels.com catalog ·
 * hardhatengineer.com). `thickness` is the minimum flange thickness excluding the raised face.
 * `boltSize` is the B16.5 inch bolt with its ISO stud equivalent. `weight` is an approximate forged WN
 * weight (hardhatengineer, agreeing with the zzsteels catalog within about 1 kg).
 *
 * An earlier table had the pipe OD in the raised-face column for most sizes and minimum thicknesses and
 * bolt sizes from other rows.
 * @reference ASME B16.5 (Class 150, 300, 600)
 */
const ASME_B16_5: Record<string, Partial<Record<PressureClass, FlangeDimension>>> = {
  '1': {
    '150': { od: 108.0, thickness: 12.7, boltCircle: 79.4, boltHoles: 4, boltSize: '1/2" (M14)', raisedFace: 50.8, weight: 1.4 },
    '300': { od: 124.0, thickness: 15.7, boltCircle: 88.9, boltHoles: 4, boltSize: '5/8" (M16)', raisedFace: 50.8, weight: 1.8 },
    '600': { od: 124.0, thickness: 17.5, boltCircle: 88.9, boltHoles: 4, boltSize: '5/8" (M16)', raisedFace: 50.8, weight: 1.8 },
  },
  '2': {
    '150': { od: 152.4, thickness: 17.5, boltCircle: 120.7, boltHoles: 4, boltSize: '5/8" (M16)', raisedFace: 92.1, weight: 2.7 },
    '300': { od: 165.1, thickness: 20.6, boltCircle: 127.0, boltHoles: 8, boltSize: '5/8" (M16)', raisedFace: 92.1, weight: 4.1 },
    '600': { od: 165.1, thickness: 25.4, boltCircle: 127.0, boltHoles: 8, boltSize: '5/8" (M16)', raisedFace: 92.1, weight: 5.5 },
  },
  '3': {
    '150': { od: 190.5, thickness: 22.4, boltCircle: 152.4, boltHoles: 4, boltSize: '5/8" (M16)', raisedFace: 127.0, weight: 4.6 },
    '300': { od: 209.6, thickness: 26.9, boltCircle: 168.3, boltHoles: 8, boltSize: '3/4" (M20)', raisedFace: 127.0, weight: 6.8 },
    '600': { od: 209.6, thickness: 31.8, boltCircle: 168.3, boltHoles: 8, boltSize: '3/4" (M20)', raisedFace: 127.0, weight: 10.5 },
  },
  '4': {
    '150': { od: 228.6, thickness: 22.4, boltCircle: 190.5, boltHoles: 8, boltSize: '5/8" (M16)', raisedFace: 157.2, weight: 6.8 },
    '300': { od: 254.0, thickness: 30.2, boltCircle: 200.2, boltHoles: 8, boltSize: '3/4" (M20)', raisedFace: 157.2, weight: 11.4 },
    '600': { od: 273.1, thickness: 38.1, boltCircle: 215.9, boltHoles: 8, boltSize: '7/8" (M24)', raisedFace: 157.2, weight: 19.1 },
  },
  '6': {
    '150': { od: 279.4, thickness: 23.9, boltCircle: 241.3, boltHoles: 8, boltSize: '3/4" (M20)', raisedFace: 215.9, weight: 10.9 },
    '300': { od: 317.5, thickness: 35.1, boltCircle: 269.9, boltHoles: 12, boltSize: '3/4" (M20)', raisedFace: 215.9, weight: 19.1 },
    '600': { od: 355.6, thickness: 47.8, boltCircle: 292.1, boltHoles: 12, boltSize: '1" (M27)', raisedFace: 215.9, weight: 36.0 },
  },
  '8': {
    '150': { od: 342.9, thickness: 26.9, boltCircle: 298.5, boltHoles: 8, boltSize: '3/4" (M20)', raisedFace: 269.9, weight: 17.7 },
    '300': { od: 381.0, thickness: 39.6, boltCircle: 330.2, boltHoles: 12, boltSize: '7/8" (M24)', raisedFace: 269.9, weight: 31.0 },
    '600': { od: 419.1, thickness: 55.6, boltCircle: 349.3, boltHoles: 12, boltSize: '1-1/8" (M30)', raisedFace: 269.9, weight: 55.0 },
  },
  '10': {
    '150': { od: 406.4, thickness: 28.4, boltCircle: 362.0, boltHoles: 12, boltSize: '7/8" (M24)', raisedFace: 323.9, weight: 24.0 },
    '300': { od: 444.5, thickness: 46.0, boltCircle: 387.4, boltHoles: 16, boltSize: '1" (M27)', raisedFace: 323.9, weight: 42.0 },
    '600': { od: 508.0, thickness: 63.5, boltCircle: 431.8, boltHoles: 16, boltSize: '1-1/4" (M33)', raisedFace: 323.9, weight: 86.0 },
  },
  '12': {
    '150': { od: 482.6, thickness: 30.2, boltCircle: 431.8, boltHoles: 12, boltSize: '7/8" (M24)', raisedFace: 381.0, weight: 37.0 },
    '300': { od: 520.7, thickness: 49.3, boltCircle: 450.9, boltHoles: 16, boltSize: '1-1/8" (M30)', raisedFace: 381.0, weight: 64.0 },
    '600': { od: 558.8, thickness: 66.5, boltCircle: 489.0, boltHoles: 20, boltSize: '1-1/4" (M33)', raisedFace: 381.0, weight: 102.0 },
  },
};

/**
 * Look up flange specifications from ASME B16.5 standard
 *
 * @reference ASME B16.5 Pipe Flanges and Flanged Fittings
 * @throws {RangeError} EN 1092-1 support not yet implemented. Use ASME_B16_5.
 * @throws {RangeError} Unknown flange size: {nps}
 * @throws {RangeError} Pressure class {pressureClass} not available for size {nps}
 * @param input - Flange standard, pressure class, nominal size
 * @returns Flange dimensions (OD, thickness, bolt pattern, weight)
 */
/**
 * NPS designations this table covers, ascending.
 *
 * Exposed for the same reason as `getPipeSizes`: without it a caller building a picker, or a test
 * asserting a property across every row, has to restate the table — and a table's copy is where the
 * two drift apart. Sorted numerically because `Object.keys` returns index-like keys ('1', '2', '10')
 * before the rest, not in declaration order.
 */
export function getFlangeSizes(): string[] {
  return Object.keys(ASME_B16_5).sort((a, b) => Number(a) - Number(b));
}

export function flangeSpec(input: FlangeSpecInput): FlangeSpecResult {
  const { standard, pressureClass, nominalSize } = input;

  if (standard === 'EN_1092_1') {
    throw new RangeError('EN 1092-1 support not yet implemented. Use ASME_B16_5.');
  }

  // Normalize nominal size (remove quotes)
  const nps = nominalSize.replace(/"/g, '').replace(/'/g, '').trim();
  const sizeData = ASME_B16_5[nps];
  if (!sizeData) {
    throw new RangeError(`Unknown flange size: ${nps}`);
  }

  const dim = sizeData[pressureClass];
  if (!dim) {
    throw new RangeError(`Pressure class ${pressureClass} not available for size ${nps}`);
  }

  return {
    nominalSize: nps,
    pressureClass,
    outerDiameter: dim.od,
    thickness: dim.thickness,
    boltCircleDiameter: dim.boltCircle,
    boltHoles: dim.boltHoles,
    boltSize: dim.boltSize,
    raisedFaceDiameter: dim.raisedFace,
    weight: dim.weight,
  };
}
