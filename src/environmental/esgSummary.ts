import { roundTo } from '../utils.js';
import type { EsgSummaryInput, EsgSummaryResult } from './types.js';

/**
 * Calculate ESG reporting summary (emissions reduction tracking)
 *
 * @formula reduction% = (baseline - current) / baseline × 100
 * @reference TCFD, CDP, SBTi
 * @param input - Baseline, current, and target emissions data
 * @returns Reduction progress, annual rate, and on-track status
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

  const reductionTonnes = roundTo(baselineCo2Tonnes - currentCo2Tonnes, 2);
  const reductionPercent = roundTo((reductionTonnes / baselineCo2Tonnes) * 100, 2);

  const yearsElapsed = currentYear - baselineYear;
  const annualRatePercent = yearsElapsed > 0
    ? roundTo(reductionPercent / yearsElapsed, 2)
    : 0;

  const yearsRemaining = targetYear - currentYear;

  // Required annual reduction rate to reach target
  const remainingReductionNeeded = currentCo2Tonnes - targetCo2Tonnes;
  const remainingReductionPercent = (remainingReductionNeeded / baselineCo2Tonnes) * 100;
  const requiredAnnualRate = yearsRemaining > 0
    ? roundTo(remainingReductionPercent / yearsRemaining, 2)
    : 0;

  // Project current trend to target year
  const annualReduction = yearsElapsed > 0 ? reductionTonnes / yearsElapsed : 0;
  const projectedCo2Tonnes = roundTo(
    currentCo2Tonnes - (annualReduction * yearsRemaining),
    2,
  );

  const onTrack = annualRatePercent >= requiredAnnualRate || currentCo2Tonnes <= targetCo2Tonnes;

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
