import type { MaterialCategory, MaterialInput, MaterialResult, MaterialSpec } from './types.js';

const MATERIAL_DATA: Record<MaterialCategory, Record<string, MaterialSpec>> = {
  steel: {
    'SS400':  { density: 7.85, tensileStrength: 400, yieldStrength: 245, elongation: 21, hardness: 'HB 120-160', thermalConductivity: 50, meltingPoint: 1510 },
    'S45C':   { density: 7.85, tensileStrength: 570, yieldStrength: 345, elongation: 17, hardness: 'HB 167-229', thermalConductivity: 49, meltingPoint: 1505 },
    'SCM440': { density: 7.85, tensileStrength: 980, yieldStrength: 830, elongation: 12, hardness: 'HB 285-352', thermalConductivity: 42, meltingPoint: 1500 },
    'SK5':    { density: 7.85, tensileStrength: 690, yieldStrength: 400, elongation: 20, hardness: 'HRC 58-63', thermalConductivity: 41, meltingPoint: 1495 },
  },
  stainless: {
    'SUS304': { density: 7.93, tensileStrength: 520, yieldStrength: 205, elongation: 40, hardness: 'HB 187', thermalConductivity: 16.3, meltingPoint: 1450 },
    'SUS316': { density: 7.98, tensileStrength: 520, yieldStrength: 205, elongation: 40, hardness: 'HB 187', thermalConductivity: 16.3, meltingPoint: 1400 },
    'SUS430': { density: 7.70, tensileStrength: 450, yieldStrength: 205, elongation: 22, hardness: 'HB 183', thermalConductivity: 26.1, meltingPoint: 1480 },
  },
  aluminum: {
    'A6061-T6':  { density: 2.70, tensileStrength: 310, yieldStrength: 276, elongation: 12, hardness: 'HB 95', thermalConductivity: 167, meltingPoint: 652 },
    'A5052-H32': { density: 2.68, tensileStrength: 228, yieldStrength: 193, elongation: 12, hardness: 'HB 60', thermalConductivity: 138, meltingPoint: 649 },
    'A7075-T6':  { density: 2.81, tensileStrength: 572, yieldStrength: 503, elongation: 11, hardness: 'HB 150', thermalConductivity: 130, meltingPoint: 635 },
  },
  copper: {
    'C1100': { density: 8.94, tensileStrength: 220, yieldStrength: 70, elongation: 45, hardness: 'HB 45', thermalConductivity: 391, meltingPoint: 1083 },
    'C2600': { density: 8.53, tensileStrength: 325, yieldStrength: 95, elongation: 65, hardness: 'HB 55-80', thermalConductivity: 120, meltingPoint: 940 },
    'C5191': { density: 8.80, tensileStrength: 520, yieldStrength: 195, elongation: 45, hardness: 'HB 160', thermalConductivity: 67, meltingPoint: 1025 },
  },
  titanium: {
    'Ti-6Al-4V':    { density: 4.43, tensileStrength: 950, yieldStrength: 880, elongation: 14, hardness: 'HRC 36', thermalConductivity: 6.7, meltingPoint: 1660 },
    'CP-Ti Grade2': { density: 4.51, tensileStrength: 345, yieldStrength: 275, elongation: 20, hardness: 'HB 200', thermalConductivity: 16.4, meltingPoint: 1668 },
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

export function material(input: MaterialInput): MaterialResult | null {
  const categoryData = MATERIAL_DATA[input.category];
  if (!categoryData) return null;

  const spec = categoryData[input.grade];
  if (!spec) return null;

  return {
    grade: input.grade,
    category: input.category,
    density: spec.density,
    tensileStrength: spec.tensileStrength,
    yieldStrength: spec.yieldStrength,
    elongation: spec.elongation,
    hardness: spec.hardness,
    thermalConductivity: spec.thermalConductivity,
    meltingPoint: spec.meltingPoint,
  };
}
