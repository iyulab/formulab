import { roundTo } from '../utils.js';
import type { MetalWeightInput, MetalWeightResult, MaterialName } from './types.js';

/**
 * Material densities in g/cm³
 *
 * @reference Oberg, E. et al. "Machinery's Handbook", 31st Ed. Industrial Press. (Density table)
 */
const MATERIAL_DENSITIES: Record<MaterialName, number> = {
  steel: 7.85,
  stainless304: 7.93,
  aluminum: 2.70,
  copper: 8.96,
  brass: 8.50,
  titanium: 4.50,
};

/**
 * Calculate metal weight based on shape, material, dimensions, and length.
 *
 * @formula Weight = Volume × Density
 *   - plate: Volume = width × thickness × length
 *   - round: Volume = π(d/2)² × length
 *   - pipe:  Volume = π(R² − r²) × length
 *   - angle: Volume = (w×t + h×t − t²) × length
 *   - All dimensions in mm → Volume converted mm³ → cm³ (÷1000) → kg (×density/1000)
 *
 * @reference Oberg, E. et al. "Machinery's Handbook", 31st Ed. Industrial Press.
 *
 * @units dimensions: mm, density: g/cm³, weight: kg
 *
 * @param input - Metal weight input parameters (discriminated by shape)
 * @returns MetalWeightResult with weight (kg), volume (cm³), and density (g/cm³)
 */
export function metalWeight(input: MetalWeightInput): MetalWeightResult {
  const { shape, length, materialName } = input;

  const density = MATERIAL_DENSITIES[materialName];

  let crossSectionArea: number; // mm2

  switch (shape) {
    case 'plate': {
      crossSectionArea = input.width * input.thickness;
      break;
    }
    case 'round': {
      const radius = input.diameter / 2;
      crossSectionArea = Math.PI * radius * radius;
      break;
    }
    case 'pipe': {
      const outerRadius = input.outerDiameter / 2;
      const innerRadius = input.innerDiameter / 2;
      crossSectionArea = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);
      break;
    }
    case 'angle': {
      // L-angle: two legs minus the corner overlap
      crossSectionArea = (input.width * input.thickness) + (input.height * input.thickness) - (input.thickness * input.thickness);
      break;
    }
  }

  // Volume in mm3
  const volumeMm3 = crossSectionArea * length;

  // Convert mm3 to cm3 (1 cm3 = 1000 mm3)
  const volumeCm3 = volumeMm3 / 1000;

  // Weight in g = volume (cm3) * density (g/cm3)
  // Weight in kg = weight (g) / 1000
  const weightKg = (volumeCm3 * density) / 1000;

  return {
    weight: roundTo(weightKg, 3),
    volume: roundTo(volumeCm3, 2),
    density,
  };
}
