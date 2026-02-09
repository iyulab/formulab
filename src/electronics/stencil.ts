import type { StencilInput, StencilResult, ComponentType } from './types.js';
import { roundTo } from '../utils.js';

/**
 * Round to specified decimal places
 */

// Recommended minimums by component type (IPC-7525B guidelines)
const RECOMMENDATIONS: Record<ComponentType, { areaRatio: number; aspectRatio: number }> = {
  bga: { areaRatio: 0.66, aspectRatio: 1.5 },      // Fine pitch BGA
  qfp: { areaRatio: 0.60, aspectRatio: 1.5 },      // QFP/QFN
  chip: { areaRatio: 0.50, aspectRatio: 1.5 },     // 0402/0603 chip components
  sot: { areaRatio: 0.55, aspectRatio: 1.5 },      // SOT/SOIC
  general: { areaRatio: 0.50, aspectRatio: 1.5 }, // General purpose
};

/**
 * Calculate stencil aperture area ratio and aspect ratio
 * @throws {RangeError} Aperture width and stencil thickness must be positive
 * @throws {RangeError} Aperture length must be positive for rectangular apertures
 * @param input - Aperture dimensions, stencil thickness, and component type
 * @returns Area ratio, aspect ratio, and pass/fail status
 */
export function stencilAperture(input: StencilInput): StencilResult {
  const { shape, apertureWidth, apertureLength, stencilThickness, componentType } = input;

  // Validate inputs
  if (apertureWidth <= 0 || stencilThickness <= 0) {
    throw new RangeError('Aperture width and stencil thickness must be positive');
  }
  if (shape === 'rectangle' && apertureLength <= 0) {
    throw new RangeError('Aperture length must be positive for rectangular apertures');
  }

  let apertureArea: number;
  let perimeter: number;

  if (shape === 'circle') {
    // For circle: width is diameter
    const radius = apertureWidth / 2;
    apertureArea = Math.PI * radius * radius;
    perimeter = Math.PI * apertureWidth;
  } else {
    // Rectangle
    apertureArea = apertureWidth * apertureLength;
    perimeter = 2 * (apertureWidth + apertureLength);
  }

  // Wall area = perimeter * stencil thickness
  const wallArea = perimeter * stencilThickness;

  // Area ratio = aperture area / wall area
  const areaRatio = apertureArea / wallArea;

  // Aspect ratio = smallest aperture dimension / stencil thickness
  const smallestDimension = shape === 'circle' ? apertureWidth : Math.min(apertureWidth, apertureLength);
  const aspectRatio = smallestDimension / stencilThickness;

  // Get recommendations for component type
  const recommendations = RECOMMENDATIONS[componentType];

  const areaRatioOk = areaRatio >= recommendations.areaRatio;
  const aspectRatioOk = aspectRatio >= recommendations.aspectRatio;

  // Determine overall status
  let status: 'good' | 'marginal' | 'poor';
  if (areaRatioOk && aspectRatioOk) {
    status = 'good';
  } else if (areaRatioOk || aspectRatioOk) {
    status = 'marginal';
  } else {
    status = 'poor';
  }

  return {
    apertureArea: roundTo(apertureArea, 4),
    wallArea: roundTo(wallArea, 4),
    areaRatio: roundTo(areaRatio, 3),
    aspectRatio: roundTo(aspectRatio, 2),
    areaRatioOk,
    aspectRatioOk,
    recommendedAreaRatio: recommendations.areaRatio,
    recommendedAspectRatio: recommendations.aspectRatio,
    status,
  };
}
