import type { OhmsLawInput } from './types.js';

/**
 * Runtime type guard for {@link OhmsLawInput} discriminated union.
 * Validates the `solveFor` discriminant and required fields for each variant.
 */
export function isOhmsLawInput(input: unknown): input is OhmsLawInput {
  if (typeof input !== 'object' || input === null) return false;
  const o = input as Record<string, unknown>;
  switch (o.solveFor) {
    case 'voltage': return typeof o.current === 'number' && typeof o.resistance === 'number';
    case 'current': return typeof o.voltage === 'number' && typeof o.resistance === 'number';
    case 'resistance': return typeof o.voltage === 'number' && typeof o.current === 'number';
    case 'power': return typeof o.voltage === 'number' && typeof o.current === 'number';
    default: return false;
  }
}
