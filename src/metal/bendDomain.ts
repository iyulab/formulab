/**
 * The domain of the sheet-metal bend formulas shared by `bendAllowance()` and `flatPattern()`.
 *
 * Outside setback is (R + T) · tan(θ/2), which diverges as θ approaches 180°: at a closed hem the
 * mold lines never meet. The bend allowance θ(R + kT) is still defined there, so a caller that only
 * needs it may pass `allowClosedHem` and accept 180°; a flat pattern built from setbacks may not.
 * The K-factor locates the neutral axis inside the material, so it lies in [0, 1].
 *
 * Not exported from the package: it states the domain once for the two functions that use it.
 */
export function assertBendDomain(input: {
  thickness: number;
  bendAngle: number;
  insideRadius: number;
  kFactor: number;
}, options: { allowClosedHem?: boolean } = {}): void {
  const { thickness, bendAngle, insideRadius, kFactor } = input;
  if (!(thickness > 0)) throw new RangeError('thickness must be greater than 0');
  if (!(insideRadius >= 0)) throw new RangeError('insideRadius must not be negative');
  if (options.allowClosedHem) {
    if (!(bendAngle > 0 && bendAngle <= 180)) throw new RangeError('bendAngle must be greater than 0 and at most 180 degrees');
  } else if (!(bendAngle > 0 && bendAngle < 180)) {
    throw new RangeError('bendAngle must be between 0 and 180 degrees (exclusive) — a closed hem has no mold-line setback');
  }
  if (!(kFactor >= 0 && kFactor <= 1)) throw new RangeError('kFactor must be between 0 and 1');
}
