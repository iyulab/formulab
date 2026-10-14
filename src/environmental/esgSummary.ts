import { roundTo } from '../utils.js';
import type { EsgSummaryInput, EsgSummaryResult } from './types.js';

/**
 * Calculate ESG reporting summary (emissions reduction tracking)
 *
 * @formula reduction% = (baseline - current) / baseline × 100
 * @reference TCFD, CDP, SBTi
 * @param input - Baseline, current, and target emissions data
 * @returns Reduction progress, annual rate, and on-track status. `annualRatePercent` and the
 *   projection are `null` when no year has elapsed since the baseline; `requiredAnnualRate` is
 *   `null` once the target year is reached; `onTrack` is `null` when the target is not yet met
 *   and there is no trend to judge it by
 * @throws {RangeError} baselineCo2Tonnes is not greater than 0, currentCo2Tonnes or
 *   targetCo2Tonnes is negative, baselineYear, currentYear or targetYear is not a positive year,
 *   or currentYear is before baselineYear
 */
export function esgSummary(input: EsgSummaryInput): EsgSummaryResult {
  const {
    baselineYear,
    baselineCo2Tonnes,
    currentYear,
    currentCo2Tonnes,
    targetYear,
    targetCo2Tonnes,
  } = input;

  // The reduction is expressed as a share of the baseline, so a zero baseline has no
  // percentage to report rather than an infinite one.
  if (!(baselineCo2Tonnes > 0)) {
    throw new RangeError('baselineCo2Tonnes must be greater than 0');
  }
  // Negative emissions (net removals) are outside this tracking model, and the years are
  // calendar years.
  if (!(currentCo2Tonnes >= 0)) {
    throw new RangeError('currentCo2Tonnes must not be negative');
  }
  if (!(targetCo2Tonnes >= 0)) {
    throw new RangeError('targetCo2Tonnes must not be negative');
  }
  if (!(baselineYear > 0)) {
    throw new RangeError('baselineYear must be greater than 0');
  }
  if (!(currentYear > 0)) {
    throw new RangeError('currentYear must be greater than 0');
  }
  if (!(targetYear > 0)) {
    throw new RangeError('targetYear must be greater than 0');
  }

  const reductionTonnes = roundTo(baselineCo2Tonnes - currentCo2Tonnes, 2);
  const reductionPercent = roundTo((reductionTonnes / baselineCo2Tonnes) * 100, 2);

  // A reading taken before its own baseline is a contradiction, not a negative trend.
  const yearsElapsed = currentYear - baselineYear;
  if (yearsElapsed < 0) {
    throw new RangeError('currentYear must not be before baselineYear');
  }
  // No elapsed time → no trend: the rate and the projection have no value, not 0.
  const annualRatePercent = yearsElapsed > 0
    ? roundTo(reductionPercent / yearsElapsed, 2)
    : null;

  const yearsRemaining = targetYear - currentYear;

  // Required annual reduction rate to reach target — none once the target year is reached.
  const remainingReductionNeeded = currentCo2Tonnes - targetCo2Tonnes;
  const remainingReductionPercent = (remainingReductionNeeded / baselineCo2Tonnes) * 100;
  const requiredAnnualRate = yearsRemaining > 0
    ? roundTo(remainingReductionPercent / yearsRemaining, 2)
    : null;

  // Project current trend to the target year. At the target year the projection is the
  // current reading; a target year already past has nothing left to project.
  let projectedCo2Tonnes: number | null = null;
  if (yearsRemaining === 0) {
    projectedCo2Tonnes = currentCo2Tonnes;
  } else if (yearsRemaining > 0 && yearsElapsed > 0) {
    projectedCo2Tonnes = roundTo(
      currentCo2Tonnes - (reductionTonnes / yearsElapsed) * yearsRemaining,
      2,
    );
  }

  // Already at or below target → on track. Otherwise the judgement needs both a trend and a
  // remaining window; past the target year it is simply not met.
  let onTrack: boolean | null;
  if (currentCo2Tonnes <= targetCo2Tonnes) {
    onTrack = true;
  } else if (requiredAnnualRate === null) {
    onTrack = false;
  } else if (annualRatePercent === null) {
    onTrack = null;
  } else {
    onTrack = annualRatePercent >= requiredAnnualRate;
  }

  return {
    reductionPercent,
    reductionTonnes,
    annualRatePercent,
    requiredAnnualRate,
    onTrack,
    yearsRemaining,
    projectedCo2Tonnes,
  };
}
