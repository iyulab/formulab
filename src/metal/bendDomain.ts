import { inputRangeError } from '../errors.js';
import type { BendingMaterial } from './types.js';

/** Above this bend angle (degrees) the springback is hard to predict — both bend functions warn. */
export const EXTREME_BEND_ANGLE = 170;

/**
 * Default K-factor values by material, read by both `bendAllowance()` and `flatPattern()`.
 *
 * K-factor is the neutral-axis position as a fraction of thickness. It is empirical:
 * it varies with forming method, tooling and lot, so the source matters as much as
 * the number.
 *
 * These are conventional air-bending defaults in common shop use; no normative source
 * is attached to them. They are a starting point, not a specification. Callers that
 * need a traceable figure should pass `input.kFactor` explicitly, or derive one from a
 * measured flat length via `kFactorReverse`.
 */
const K_FACTOR_TABLE: Record<BendingMaterial, number> = {
  mildSteel: 0.44,
  stainless304: 0.45,
  aluminum5052: 0.40,
  aluminum6061: 0.42,
  custom: 0.44,
};

/**
 * The K-factor a bend function uses: the caller's `kFactor` when given, otherwise the material's
 * default. An unknown material with no `kFactor` is refused here, naming `material` — it used to
 * surface as «kFactor outside [0, 1]», the wrong field.
 */
export function resolveKFactor(material: BendingMaterial, kFactor: number | undefined): number {
  if (kFactor !== undefined) return kFactor;
  if (!Object.hasOwn(K_FACTOR_TABLE, material)) {
    throw new RangeError(`material must be one of ${Object.keys(K_FACTOR_TABLE).join(', ')} (or give kFactor), got ${String(material)}`);
  }
  return K_FACTOR_TABLE[material];
}

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
  if (!(thickness > 0)) {
    throw inputRangeError('thickness must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'thickness', exclusive_min: 0, got: thickness,
    });
  }
  if (!(insideRadius >= 0)) {
    throw inputRangeError('insideRadius must not be negative', {
      code: 'parameter_out_of_range', parameter: 'insideRadius', min: 0, got: insideRadius,
    });
  }
  if (options.allowClosedHem) {
    if (!(bendAngle > 0 && bendAngle <= 180)) {
      throw inputRangeError('bendAngle must be greater than 0 and at most 180 degrees', {
        code: 'parameter_out_of_range', parameter: 'bendAngle', exclusive_min: 0, max: 180, got: bendAngle,
      });
    }
  } else if (!(bendAngle > 0 && bendAngle < 180)) {
    throw inputRangeError('bendAngle must be between 0 and 180 degrees (exclusive) — a closed hem has no mold-line setback', {
      code: 'parameter_out_of_range', parameter: 'bendAngle', exclusive_min: 0, exclusive_max: 180, got: bendAngle,
    });
  }
  if (!(kFactor >= 0 && kFactor <= 1)) {
    throw inputRangeError('kFactor must be between 0 and 1', {
      code: 'parameter_out_of_range', parameter: 'kFactor', min: 0, max: 1, got: kFactor,
    });
  }
}
