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
