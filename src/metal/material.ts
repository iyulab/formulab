import type { MaterialCategory, MaterialInput, MaterialResult, MaterialSpec } from './types.js';

/**
 * Young's modulus (E, GPa) is the room-temperature reference value for each grade
 * (ASM Handbook Vol. 1/2 · MatWeb datasheets). It is a material constant, not a
 * heat-treat-sensitive strength, so one value per grade is the standard treatment.
 * Required by springback() and any deflection calculation.
 */
const MATERIAL_DATA: Record<MaterialCategory, Record<string, MaterialSpec>> = {
  steel: {
    'SS400':  { density: 7.85, tensileStrength: 400, yieldStrength: 245, youngsModulus: 205, elongation: 21, hardness: 'HB 120-160', thermalConductivity: 50, meltingPoint: 1510 },
    'S45C':   { density: 7.85, tensileStrength: 570, yieldStrength: 345, youngsModulus: 205, elongation: 17, hardness: 'HB 167-229', thermalConductivity: 49, meltingPoint: 1505 },
    'SCM440': { density: 7.85, tensileStrength: 980, yieldStrength: 830, youngsModulus: 205, elongation: 12, hardness: 'HB 285-352', thermalConductivity: 42, meltingPoint: 1500 },
    'SK5':    { density: 7.85, tensileStrength: 690, yieldStrength: 400, youngsModulus: 205, elongation: 20, hardness: 'HRC 58-63', thermalConductivity: 41, meltingPoint: 1495 },
  },
  stainless: {
    'SUS304': { density: 7.93, tensileStrength: 520, yieldStrength: 205, youngsModulus: 193, elongation: 40, hardness: 'HB 187', thermalConductivity: 16.3, meltingPoint: 1450 },
    'SUS316': { density: 7.98, tensileStrength: 520, yieldStrength: 205, youngsModulus: 193, elongation: 40, hardness: 'HB 187', thermalConductivity: 16.3, meltingPoint: 1400 },
    'SUS430': { density: 7.70, tensileStrength: 450, yieldStrength: 205, youngsModulus: 200, elongation: 22, hardness: 'HB 183', thermalConductivity: 26.1, meltingPoint: 1480 },
  },
  aluminum: {
    'A6061-T6':  { density: 2.70, tensileStrength: 310, yieldStrength: 276, youngsModulus: 68.9, elongation: 12, hardness: 'HB 95', thermalConductivity: 167, meltingPoint: 652 },
    'A5052-H32': { density: 2.68, tensileStrength: 228, yieldStrength: 193, youngsModulus: 70.3, elongation: 12, hardness: 'HB 60', thermalConductivity: 138, meltingPoint: 649 },
    'A7075-T6':  { density: 2.81, tensileStrength: 572, yieldStrength: 503, youngsModulus: 71.7, elongation: 11, hardness: 'HB 150', thermalConductivity: 130, meltingPoint: 635 },
  },
  copper: {
    'C1100': { density: 8.94, tensileStrength: 220, yieldStrength: 70, youngsModulus: 115, elongation: 45, hardness: 'HB 45', thermalConductivity: 391, meltingPoint: 1083 },
    'C2600': { density: 8.53, tensileStrength: 325, yieldStrength: 95, youngsModulus: 110, elongation: 65, hardness: 'HB 55-80', thermalConductivity: 120, meltingPoint: 940 },
    'C5191': { density: 8.80, tensileStrength: 520, yieldStrength: 195, youngsModulus: 110, elongation: 45, hardness: 'HB 160', thermalConductivity: 67, meltingPoint: 1025 },
  },
  titanium: {
    'Ti-6Al-4V':    { density: 4.43, tensileStrength: 950, yieldStrength: 880, youngsModulus: 113.8, elongation: 14, hardness: 'HRC 36', thermalConductivity: 6.7, meltingPoint: 1660 },
    'CP-Ti Grade2': { density: 4.51, tensileStrength: 345, yieldStrength: 275, youngsModulus: 105, elongation: 20, hardness: 'HB 200', thermalConductivity: 16.4, meltingPoint: 1668 },
  },
};

export function getCategories(): MaterialCategory[] {
  return Object.keys(MATERIAL_DATA) as MaterialCategory[];
}

export function getGrades(category: MaterialCategory): string[] {
  const data = MATERIAL_DATA[category];
  if (!data) return [];
  return Object.keys(data);
}

/**
 * Look up mechanical and physical properties for a material grade.
 *
 * @throws RangeError if the material category or grade is unknown
 */
export function material(input: MaterialInput): MaterialResult {
  const categoryData = MATERIAL_DATA[input.category];
  if (!categoryData) {
    throw new RangeError('unknown material category: ' + input.category);
  }

  const spec = categoryData[input.grade];
  if (!spec) {
    throw new RangeError('unknown material grade: ' + input.grade);
  }

  return {
    grade: input.grade,
    category: input.category,
    density: spec.density,
    tensileStrength: spec.tensileStrength,
    yieldStrength: spec.yieldStrength,
    youngsModulus: spec.youngsModulus,
    elongation: spec.elongation,
    hardness: spec.hardness,
    thermalConductivity: spec.thermalConductivity,
    meltingPoint: spec.meltingPoint,
  };
}
