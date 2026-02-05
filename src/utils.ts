/**
 * Round a number to the specified number of decimal places
 *
 * Uses epsilon correction to handle floating-point precision issues.
 * Example: roundTo(0.615, 2) correctly returns 0.62, not 0.61
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
  // Add epsilon correction for floating-point precision
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
