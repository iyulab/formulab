import type { MomentOfInertiaInput } from './types.js';

/**
 * Runtime type guard for {@link MomentOfInertiaInput} discriminated union.
 * Validates the `shape` discriminant and required fields for each of 7 variants.
 */
export function isMomentOfInertiaInput(input: unknown): input is MomentOfInertiaInput {
  if (typeof input !== 'object' || input === null) return false;
  const o = input as Record<string, unknown>;
  switch (o.shape) {
    case 'rectangle':
      return typeof o.width === 'number' && typeof o.height === 'number';
    case 'circle':
      return typeof o.diameter === 'number';
    case 'hollowRectangle':
      return typeof o.outerWidth === 'number' && typeof o.outerHeight === 'number' &&
        typeof o.innerWidth === 'number' && typeof o.innerHeight === 'number';
    case 'hollowCircle':
      return typeof o.outerDiameter === 'number' && typeof o.innerDiameter === 'number';
    case 'iBeam':
      return typeof o.flangeWidth === 'number' && typeof o.totalHeight === 'number' &&
        typeof o.webThickness === 'number' && typeof o.flangeThickness === 'number';
    case 'tSection':
      return typeof o.flangeWidth === 'number' && typeof o.flangeThickness === 'number' &&
        typeof o.webThickness === 'number' && typeof o.webHeight === 'number';
    case 'cChannel':
      return typeof o.flangeWidth === 'number' && typeof o.totalHeight === 'number' &&
        typeof o.webThickness === 'number' && typeof o.flangeThickness === 'number';
    default: return false;
  }
}
