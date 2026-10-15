import { roundTo, requireFinite } from '../utils.js';
import type { MetalWeightInput, MetalWeightResult, MaterialName } from './types.js';
import { InputRangeError } from '../errors.js';

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
 * @throws {RangeError} materialName is unknown; a dimension (length, width, thickness, diameter, outerDiameter, height) is not
 *   greater than 0; innerDiameter < 0 or ≥ outerDiameter; an angle thickness exceeds its width or height
 */
export function metalWeight(input: MetalWeightInput): MetalWeightResult {
  requireFinite('metalWeight', input);
  const { shape, length, materialName } = input;

  if (!(length > 0)) {
    throw new InputRangeError('length must be positive', {
      code: 'parameter_out_of_range', parameter: 'length', exclusive_min: 0, got: length,
    });
  }

  // An unknown material has no density: the weight came back empty with no reason given.
  if (!Object.hasOwn(MATERIAL_DENSITIES, materialName)) {
    throw new RangeError(`materialName must be one of ${Object.keys(MATERIAL_DENSITIES).join(', ')}, got ${String(materialName)}`);
  }
  const density = MATERIAL_DENSITIES[materialName];

  let crossSectionArea: number; // mm2

  switch (shape) {
    case 'plate': {
      if (!(input.width > 0)) {
        throw new InputRangeError('width must be positive', {
          code: 'parameter_out_of_range', parameter: 'width', exclusive_min: 0, got: input.width,
        });
      }
      if (!(input.thickness > 0)) {
        throw new InputRangeError('thickness must be positive', {
          code: 'parameter_out_of_range', parameter: 'thickness', exclusive_min: 0, got: input.thickness,
        });
      }
      crossSectionArea = input.width * input.thickness;
      break;
    }
    case 'round': {
      if (!(input.diameter > 0)) {
        throw new InputRangeError('diameter must be positive', {
          code: 'parameter_out_of_range', parameter: 'diameter', exclusive_min: 0, got: input.diameter,
        });
      }
      const radius = input.diameter / 2;
      crossSectionArea = Math.PI * radius * radius;
      break;
    }
    case 'pipe': {
      if (!(input.outerDiameter > 0)) {
        throw new InputRangeError('outerDiameter must be positive', {
          code: 'parameter_out_of_range', parameter: 'outerDiameter', exclusive_min: 0, got: input.outerDiameter,
        });
      }
      if (!(input.innerDiameter >= 0)) {
        throw new InputRangeError('innerDiameter must be non-negative', {
          code: 'parameter_out_of_range', parameter: 'innerDiameter', min: 0, got: input.innerDiameter,
        });
      }
      if (input.outerDiameter <= input.innerDiameter) {
        throw new InputRangeError('outerDiameter must be greater than innerDiameter', {
          code: 'parameter_out_of_range', parameter: 'outerDiameter', exclusive_min: input.innerDiameter, got: input.outerDiameter,
        });
      }
      const outerRadius = input.outerDiameter / 2;
      const innerRadius = input.innerDiameter / 2;
      crossSectionArea = Math.PI * (outerRadius * outerRadius - innerRadius * innerRadius);
      break;
    }
    case 'angle': {
      if (!(input.width > 0)) {
        throw new InputRangeError('width must be positive', {
          code: 'parameter_out_of_range', parameter: 'width', exclusive_min: 0, got: input.width,
        });
      }
      if (!(input.height > 0)) {
        throw new InputRangeError('height must be positive', {
          code: 'parameter_out_of_range', parameter: 'height', exclusive_min: 0, got: input.height,
        });
      }
      if (!(input.thickness > 0)) {
        throw new InputRangeError('thickness must be positive', {
          code: 'parameter_out_of_range', parameter: 'thickness', exclusive_min: 0, got: input.thickness,
        });
      }
      // A leg cannot be thinner than the section is thick; past that the corner overlap exceeds the legs.
      if (input.thickness > Math.min(input.width, input.height)) {
        throw new RangeError('thickness must not exceed width or height');
      }
      // L-angle: two legs minus the corner overlap
      crossSectionArea = (input.width * input.thickness) + (input.height * input.thickness) - (input.thickness * input.thickness);
      break;
    }
    default: {
      // Unreachable for typed callers; untyped form/API data gets a reason, not an empty weight.
      const unknownShape: never = shape;
      throw new RangeError(`shape must be plate, round, pipe, or angle, got ${String(unknownShape)}`);
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
