import type { ConformityDecisionInput, ConformityDecisionResult, ConformityStatement } from './types.js';
import { requireFinite, roundTo } from '../utils.js';
import { normalCDF } from '../math.js';
import { inputRangeError } from '../errors.js';

/**
 * Decide whether a measured value conforms to a tolerance, with a guard band derived from the measurement's
 * expanded uncertainty — the decision rule of a statement of conformity.
 *
 * @formula
 *   - Guard band: w = r · U (r = `guardBandFactor`, U = `expandedUncertainty`)
 *   - Acceptance interval: [LL + w, UL − w] — the tolerance shrunk by w at each given limit
 *   - Rejection limits: LL − w and UL + w
 *   - pass: measured is inside the acceptance interval
 *   - conditionalPass: inside the tolerance but not inside the acceptance interval (in the guard band)
 *   - conditionalFail: outside the tolerance but not beyond the rejection limits
 *   - fail: beyond a rejection limit
 *   - Conformance probability (normal PDF for the measurand, no prior knowledge of the item):
 *     p_c = Φ((UL − y)/u) − Φ((LL − y)/u), with u = U / k; with one limit only the other Φ term is dropped
 *     (p_c = Φ((UL − y)/u), or Φ((y − LL)/u))
 *
 * @reference ILAC-G8:09/2019, Guidelines on Decision Rules and Statements of Conformity, §4.1 and §4.2.1–4.2.3
 *   (guard band w = TL − AL; simple acceptance w = 0; binary and non-binary statements), Table 1 (guard bands w = rU and the
 *   specific false-accept risks they give).
 * @reference JCGM 106:2012, Evaluation of measurement data — The role of measurement uncertainty in conformity assessment,
 *   §7.2–7.3 expressions (6)–(9) (conformance probability) and §8.2 (simple acceptance, «shared risk»), §9 (guard bands).
 *
 * @units measured, limits, expandedUncertainty and the guard band share one unit; probabilities are 0–1;
 *   guardBandFactor and coverageFactor are dimensionless
 *
 * @remarks
 *   - **Simple acceptance** is `guardBandFactor = 0`: no conditional classes exist, a result exactly on a limit has a
 *     conformance probability of 0.5 — pass and fail are shared risk.
 *   - ILAC-G8 Table 1: r = 1 with k = 2 keeps the specific false-accept risk at an acceptance limit below 2.5 % (Φ(−2));
 *     r = 1.5 → 0.14 % (3σ); r = 3 → below 1 ppm (6σ); r = 0.83 → below 5 %. ISO 14253-1's default is r = 1.
 *   - The conformance probability assumes a normal PDF and no prior knowledge of how items are distributed
 *     (JCGM 106 «meagre prior information»); with a known item population the risks differ (global risk, JCGM 106 §9.1).
 *   - A guard band wider than half a two-sided tolerance leaves no acceptance interval: `acceptanceIntervalEmpty` is
 *     true, nothing can be `pass`, and a measured value inside the tolerance is `conditionalPass`.
 *   - `expandedUncertainty = 0` gives a conformance probability of 1 inside the tolerance and 0 outside.
 *   - A decision rule is agreed before measuring (ILAC-G8 §4.2.3): the same measured value can pass under one rule
 *     and not under a larger guard band — report `guardBandFactor` with the statement.
 *
 * @validation
 *   - guardBandFactor 0 → pass iff the value is within [LL, UL] (limits included)
 *   - measured exactly on an acceptance limit → pass (the limit is inclusive)
 *
 * @param input - Measured value, one or two tolerance limits, expanded uncertainty, optional guard-band factor and coverage factor
 * @returns The statement of conformity, the limits it was made against, and the conformance probability
 * @throws {RangeError} neither limit is given (`missing_option`), upperLimit is not greater than lowerLimit,
 *   expandedUncertainty or guardBandFactor is negative, coverageFactor is not greater than 0, or any number is not finite
 */
export function conformityDecision(input: ConformityDecisionInput): ConformityDecisionResult {
  requireFinite('conformityDecision', input);
  const { measured, upperLimit, lowerLimit, expandedUncertainty, coverageFactor = 2, guardBandFactor = 1 } = input;

  if (upperLimit === undefined && lowerLimit === undefined) {
    throw inputRangeError('at least one of upperLimit and lowerLimit is required', { code: 'missing_option', parameter: 'upperLimit' });
  }
  if (upperLimit !== undefined && lowerLimit !== undefined && !(upperLimit > lowerLimit)) {
    throw inputRangeError('upperLimit must be greater than lowerLimit', {
      code: 'parameter_out_of_range', parameter: 'upperLimit', exclusive_min: lowerLimit, got: upperLimit,
    });
  }
  if (!(expandedUncertainty >= 0)) {
    throw inputRangeError('expandedUncertainty must not be negative', {
      code: 'parameter_out_of_range', parameter: 'expandedUncertainty', min: 0, got: expandedUncertainty,
    });
  }
  if (!(coverageFactor > 0)) {
    throw inputRangeError('coverageFactor must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'coverageFactor', exclusive_min: 0, got: coverageFactor,
    });
  }
  if (!(guardBandFactor >= 0)) {
    throw inputRangeError('guardBandFactor must not be negative', {
      code: 'parameter_out_of_range', parameter: 'guardBandFactor', min: 0, got: guardBandFactor,
    });
  }

  const w = guardBandFactor * expandedUncertainty;
  const u = expandedUncertainty / coverageFactor;

  // The limits are compared as reported (rounded to 9 places): `10 - 0.3` and `9.7` are the same limit to a person.
  const acceptanceLower = lowerLimit === undefined ? null : roundTo(lowerLimit + w, 9);
  const acceptanceUpper = upperLimit === undefined ? null : roundTo(upperLimit - w, 9);
  const rejectionLower = lowerLimit === undefined ? null : roundTo(lowerLimit - w, 9);
  const rejectionUpper = upperLimit === undefined ? null : roundTo(upperLimit + w, 9);

  const within = (lo: number | null, hi: number | null): boolean =>
    (lo === null || measured >= lo) && (hi === null || measured <= hi);

  const withinTolerance = within(lowerLimit ?? null, upperLimit ?? null);
  const acceptanceIntervalEmpty = acceptanceLower !== null && acceptanceUpper !== null && acceptanceLower > acceptanceUpper;

  let decision: ConformityStatement;
  if (within(acceptanceLower, acceptanceUpper)) decision = 'pass';
  else if (withinTolerance) decision = 'conditionalPass';
  else if (within(rejectionLower, rejectionUpper)) decision = 'conditionalFail';
  else decision = 'fail';

  // JCGM 106 (6)–(9): the probability that the measurand lies in the tolerance interval.
  let conformanceProbability: number;
  if (u === 0) {
    conformanceProbability = withinTolerance ? 1 : 0;
  } else {
    const below = upperLimit === undefined ? 1 : normalCDF((upperLimit - measured) / u);
    const under = lowerLimit === undefined ? 0 : normalCDF((lowerLimit - measured) / u);
    conformanceProbability = Math.min(1, Math.max(0, below - under));
  }

  return {
    decision,
    binaryDecision: decision === 'pass' ? 'pass' : 'fail',
    withinTolerance,
    guardBand: roundTo(w, 9),
    acceptanceLower,
    acceptanceUpper,
    rejectionLower,
    rejectionUpper,
    acceptanceIntervalEmpty,
    standardUncertainty: roundTo(u, 9),
    conformanceProbability: roundTo(conformanceProbability, 6),
  };
}
