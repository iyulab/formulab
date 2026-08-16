/**
 * Shared mathematical functions for statistical calculations.
 *
 * These functions were previously duplicated across multiple domain files.
 * Consolidated here for maintainability.
 */

/**
 * Interval propagation through an arbitrary function by corner-case
 * evaluation: run `fn` at every combination of each uncertain input's
 * ± half-width, and take the min/max of the extracted output over those
 * corners plus the nominal point.
 *
 * No Monte Carlo, no distribution -- a caller who wants a defensible range
 * from a measurement uncertainty (an instrument's stated accuracy, not a
 * probability model) gets exactly that. Exact for a function monotonic in
 * each uncertain input; a sound bound for a smooth one over a small
 * uncertainty window even where the sign of a partial derivative varies
 * elsewhere in the input space (as it does for `kFactorReverse` across
 * different bend angles) -- the window itself is small enough that the
 * function's local behavior around the nominal point is what matters, not
 * its global shape.
 *
 * `2^n` evaluations for `n` uncertain inputs -- deliberately only for small
 * `n` (a handful of measured quantities feeding one derived value), not a
 * general sensitivity-analysis tool.
 *
 * @param nominal - the input at its stated (measured) values
 * @param uncertainty - a ± half-width for each input that carries one;
 *   inputs not listed here are treated as exact
 * @param fn - the function to propagate through
 * @param pick - extracts the single numeric output to bound from `fn`'s result
 */
export function propagate<TIn extends object, TOut>(
  nominal: TIn,
  uncertainty: Partial<Record<keyof TIn, number>>,
  fn: (input: TIn) => TOut,
  pick: (output: TOut) => number,
): { value: number; min: number; max: number } {
  const keys = (Object.keys(uncertainty) as (keyof TIn)[]).filter(
    (k) => uncertainty[k] !== undefined,
  );
  const value = pick(fn(nominal));
  let min = value;
  let max = value;

  const corners = 1 << keys.length;
  for (let mask = 0; mask < corners; mask++) {
    const input = { ...nominal };
    keys.forEach((key, i) => {
      const half = uncertainty[key]!;
      const sign = (mask >> i) & 1 ? 1 : -1;
      (input as Record<string, number>)[key as string] = (nominal[key] as number) + sign * half;
    });
    const out = pick(fn(input));
    if (out < min) min = out;
    if (out > max) max = out;
  }

  return { value, min, max };
}

/**
 * Standard normal CDF approximation using Abramowitz and Stegun.
 *
 * @param x - z-score
 * @returns Cumulative probability P(Z ≤ x)
 */
export function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Approximation of the inverse normal CDF (probit function).
 * Uses rational approximation from Abramowitz and Stegun.
 *
 * @param p - Probability (0 < p < 1)
 * @returns z-score such that P(Z ≤ z) = p
 */
export function normalInvCDF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.383577518672690e2,
    -3.066479806614716e1,
    2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838e0,
    -2.549732539343734e0,
    4.374664141464968e0,
    2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number, r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}
