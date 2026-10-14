/**
 * Round a number to the specified number of decimal places
 *
 * Uses sign-aware epsilon correction to handle floating-point precision
 * issues for both positive and negative numbers.
 * Example: roundTo(0.615, 2) → 0.62, roundTo(-2.555, 2) → -2.56
 *
 * @param value - The number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number, or the original value if NaN/Infinity
 */
export function roundTo(value: number, decimals: number = 2): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const factor = Math.pow(10, decimals);
  // Sign-aware epsilon correction for floating-point precision
  const sign = Math.sign(value) || 1;
  return Math.round((value + sign * Number.EPSILON) * factor) / factor;
}

/**
 * Refuse any non-finite number anywhere in a function's input — the library-wide input contract.
 *
 * A guard written `x <= 0` lets NaN through (every comparison with NaN is false), and the formula then
 * returns `null` outputs beside a confident verdict. Checking each field by hand left 99 functions open
 * to it (2026-10 execution audit; `check:nonfinite-inputs` keeps it closed); one walk at the entry point closes the
 * class. Nested objects and arrays are walked; strings, booleans, null and undefined are not numbers
 * and are left to the function's own validation.
 *
 * @param fn - The public function's name, for the message
 * @param input - The function's argument (or an object of its arguments)
 * @throws {RangeError} When any number in `input` is NaN or ±Infinity
 */
export function requireFinite(fn: string, input: unknown): void {
  const bad = firstNonFinite(input, '');
  if (bad !== null) {
    throw new RangeError(`${fn}: ${bad.path || 'input'} must be a finite number (got ${bad.value})`);
  }
}

function firstNonFinite(value: unknown, path: string): { path: string; value: number } | null {
  if (typeof value === 'number') return Number.isFinite(value) ? null : { path, value };
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const bad = firstNonFinite(value[i], `${path}[${i}]`);
      if (bad) return bad;
    }
    return null;
  }
  if (value !== null && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      const bad = firstNonFinite(v, path ? `${path}.${key}` : key);
      if (bad) return bad;
    }
  }
  return null;
}
