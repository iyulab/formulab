import type { MetalWeightInput, BoltInput } from './types.js';

/**
 * Runtime type guard for {@link MetalWeightInput} discriminated union.
 * Validates the `shape` discriminant, base fields, and required fields for each variant.
 */
export function isMetalWeightInput(input: unknown): input is MetalWeightInput {
  if (typeof input !== 'object' || input === null) return false;
  const o = input as Record<string, unknown>;
  if (typeof o.length !== 'number' || typeof o.materialName !== 'string') return false;
  switch (o.shape) {
    case 'plate': return typeof o.width === 'number' && typeof o.thickness === 'number';
    case 'round': return typeof o.diameter === 'number';
    case 'pipe': return typeof o.outerDiameter === 'number' && typeof o.innerDiameter === 'number';
    case 'angle': return typeof o.width === 'number' && typeof o.height === 'number' && typeof o.thickness === 'number';
    default: return false;
  }
}

/**
 * Runtime type guard for {@link BoltInput} discriminated union.
 * Validates the `mode` discriminant, base fields, and required fields for each variant.
 */
export function isBoltInput(input: unknown): input is BoltInput {
  if (typeof input !== 'object' || input === null) return false;
  const o = input as Record<string, unknown>;
  if (typeof o.diameter !== 'number' || typeof o.pitch !== 'number' ||
      typeof o.kFactor !== 'number' || typeof o.tensileStrength !== 'number') return false;
  switch (o.mode) {
    case 'torqueToPreload': return typeof o.torque === 'number';
    case 'preloadToTorque': return typeof o.preload === 'number';
    default: return false;
  }
}
