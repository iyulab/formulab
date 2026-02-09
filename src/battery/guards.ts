import type { CRateInput } from './types.js';

/**
 * Runtime type guard for {@link CRateInput} discriminated union.
 * Validates the `mode` discriminant and required fields for each variant.
 */
export function isCRateInput(input: unknown): input is CRateInput {
  if (typeof input !== 'object' || input === null) return false;
  const o = input as Record<string, unknown>;
  if (typeof o.capacityAh !== 'number') return false;
  switch (o.mode) {
    case 'currentToRate': return typeof o.currentA === 'number';
    case 'rateToCurrent': return typeof o.cRate === 'number';
    default: return false;
  }
}
