/**
 * The domain of the sheet-metal bend formulas shared by `bendAllowance()` and `flatPattern()`.
 *
 * Outside setback is (R + T) · tan(θ/2), which diverges as θ approaches 180° — a closed hem is
 * not a bend these formulas describe, and an angle near it returns lengths of 10¹⁷ mm that read as
 * results. The K-factor locates the neutral axis inside the material, so it lies in [0, 1].
 *
 * Not exported from the package: it states the domain once for the two functions that use it.
 */
export function assertBendDomain(input: {
  thickness: number;
  bendAngle: number;
  insideRadius: number;
  kFactor: number;
}): void {
  const { thickness, bendAngle, insideRadius, kFactor } = input;
  if (!(thickness > 0)) throw new RangeError('thickness must be greater than 0');
  if (!(insideRadius >= 0)) throw new RangeError('insideRadius must not be negative');
  if (!(bendAngle > 0 && bendAngle < 180)) {
    throw new RangeError('bendAngle must be between 0 and 180 degrees (exclusive) — a closed hem is outside the bend formulas');
  }
  if (!(kFactor >= 0 && kFactor <= 1)) throw new RangeError('kFactor must be between 0 and 1');
}
