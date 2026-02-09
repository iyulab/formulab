import type { DilutionInput, ReactorInput, HeatTransferInput } from './types.js';

/**
 * Runtime type guard for {@link DilutionInput} discriminated union.
 * Validates the `solveFor` discriminant and required fields for each variant.
 */
export function isDilutionInput(input: unknown): input is DilutionInput {
  if (typeof input !== 'object' || input === null) return false;
  const o = input as Record<string, unknown>;
  switch (o.solveFor) {
    case 'c1': return typeof o.v1 === 'number' && typeof o.c2 === 'number' && typeof o.v2 === 'number';
    case 'v1': return typeof o.c1 === 'number' && typeof o.c2 === 'number' && typeof o.v2 === 'number';
    case 'c2': return typeof o.c1 === 'number' && typeof o.v1 === 'number' && typeof o.v2 === 'number';
    case 'v2': return typeof o.c1 === 'number' && typeof o.v1 === 'number' && typeof o.c2 === 'number';
    default: return false;
  }
}

/**
 * Runtime type guard for {@link ReactorInput} discriminated union.
 * Validates the `shape` discriminant and required fields for each variant.
 */
export function isReactorInput(input: unknown): input is ReactorInput {
  if (typeof input !== 'object' || input === null) return false;
  const o = input as Record<string, unknown>;
  if (typeof o.diameter !== 'number' || typeof o.fillRatio !== 'number') return false;
  switch (o.shape) {
    case 'cylindrical': return typeof o.height === 'number';
    case 'spherical': return true;
    default: return false;
  }
}

/**
 * Runtime type guard for {@link HeatTransferInput} discriminated union.
 * Validates the `mode` discriminant and required fields for each variant.
 */
export function isHeatTransferInput(input: unknown): input is HeatTransferInput {
  if (typeof input !== 'object' || input === null) return false;
  const o = input as Record<string, unknown>;
  switch (o.mode) {
    case 'conduction':
      return typeof o.conductivity === 'number' && typeof o.area === 'number' &&
        typeof o.thickness === 'number' && typeof o.tempHot === 'number' && typeof o.tempCold === 'number';
    case 'convection':
      return typeof o.coefficient === 'number' && typeof o.area === 'number' &&
        typeof o.tempSurface === 'number' && typeof o.tempFluid === 'number';
    case 'radiation':
      return typeof o.emissivity === 'number' && typeof o.area === 'number' &&
        typeof o.tempHot === 'number' && typeof o.tempCold === 'number';
    default: return false;
  }
}
