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
 * ASME B16.5 Welding Neck flange dimensions
 * @reference ASME B16.5 (Class 150, 300, 600)
 */
const ASME_B16_5: Record<string, Partial<Record<PressureClass, FlangeDimension>>> = {
  '1':   {
    '150': { od: 108.0, thickness: 14.2, boltCircle: 79.4,  boltHoles: 4,  boltSize: 'M12',  raisedFace: 50.8,  weight: 1.1 },
    '300': { od: 124.0, thickness: 17.5, boltCircle: 88.9,  boltHoles: 4,  boltSize: 'M16',  raisedFace: 50.8,  weight: 2.1 },
    '600': { od: 124.0, thickness: 20.6, boltCircle: 88.9,  boltHoles: 4,  boltSize: 'M16',  raisedFace: 50.8,  weight: 2.5 },
  },
  '2':   {
    '150': { od: 152.4, thickness: 15.7, boltCircle: 120.7, boltHoles: 4,  boltSize: 'M16',  raisedFace: 73.0,  weight: 2.5 },
    '300': { od: 165.1, thickness: 20.6, boltCircle: 127.0, boltHoles: 8,  boltSize: 'M16',  raisedFace: 73.0,  weight: 4.1 },
    '600': { od: 165.1, thickness: 25.4, boltCircle: 127.0, boltHoles: 8,  boltSize: 'M16',  raisedFace: 73.0,  weight: 5.0 },
  },
  '3':   {
    '150': { od: 190.5, thickness: 17.5, boltCircle: 152.4, boltHoles: 4,  boltSize: 'M16',  raisedFace: 98.4,  weight: 3.9 },
    '300': { od: 210.0, thickness: 22.4, boltCircle: 168.3, boltHoles: 8,  boltSize: 'M20',  raisedFace: 98.4,  weight: 6.3 },
    '600': { od: 210.0, thickness: 28.4, boltCircle: 168.3, boltHoles: 8,  boltSize: 'M20',  raisedFace: 98.4,  weight: 8.0 },
  },
  '4':   {
    '150': { od: 228.6, thickness: 19.1, boltCircle: 190.5, boltHoles: 8,  boltSize: 'M16',  raisedFace: 122.2, weight: 5.5 },
    '300': { od: 254.0, thickness: 25.4, boltCircle: 200.0, boltHoles: 8,  boltSize: 'M20',  raisedFace: 122.2, weight: 9.3 },
    '600': { od: 273.1, thickness: 31.8, boltCircle: 215.9, boltHoles: 8,  boltSize: 'M22',  raisedFace: 122.2, weight: 14.0 },
  },
  '6':   {
    '150': { od: 279.4, thickness: 22.4, boltCircle: 241.3, boltHoles: 8,  boltSize: 'M20',  raisedFace: 168.3, weight: 8.6 },
    '300': { od: 318.0, thickness: 28.4, boltCircle: 269.9, boltHoles: 12, boltSize: 'M20',  raisedFace: 168.3, weight: 17.0 },
    '600': { od: 355.6, thickness: 36.6, boltCircle: 292.1, boltHoles: 12, boltSize: 'M22',  raisedFace: 168.3, weight: 28.0 },
  },
  '8':   {
    '150': { od: 342.9, thickness: 24.4, boltCircle: 298.5, boltHoles: 8,  boltSize: 'M20',  raisedFace: 219.1, weight: 13.0 },
    '300': { od: 381.0, thickness: 33.3, boltCircle: 330.2, boltHoles: 12, boltSize: 'M22',  raisedFace: 219.1, weight: 27.0 },
    '600': { od: 419.1, thickness: 42.9, boltCircle: 349.3, boltHoles: 12, boltSize: 'M25',  raisedFace: 219.1, weight: 45.0 },
  },
  '10':  {
    '150': { od: 406.4, thickness: 26.9, boltCircle: 362.0, boltHoles: 12, boltSize: 'M22',  raisedFace: 273.1, weight: 19.0 },
    '300': { od: 444.5, thickness: 36.6, boltCircle: 387.4, boltHoles: 16, boltSize: 'M25',  raisedFace: 273.1, weight: 38.0 },
    '600': { od: 508.0, thickness: 50.8, boltCircle: 431.8, boltHoles: 16, boltSize: 'M30',  raisedFace: 273.1, weight: 70.0 },
  },
  '12':  {
    '150': { od: 482.6, thickness: 28.4, boltCircle: 431.8, boltHoles: 12, boltSize: 'M22',  raisedFace: 323.9, weight: 27.0 },
    '300': { od: 521.0, thickness: 39.6, boltCircle: 450.8, boltHoles: 16, boltSize: 'M25',  raisedFace: 323.9, weight: 54.0 },
    '600': { od: 559.0, thickness: 55.6, boltCircle: 489.0, boltHoles: 20, boltSize: 'M30',  raisedFace: 323.9, weight: 95.0 },
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
