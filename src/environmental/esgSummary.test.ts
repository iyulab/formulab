import { describe, it, expect } from 'vitest';
import { esgSummary } from './esgSummary.js';

describe('esgSummary', () => {
  it('should calculate reduction progress', () => {
    const result = esgSummary({
      baselineYear: 2020,
      baselineCo2Tonnes: 10000,
      currentYear: 2025,
      currentCo2Tonnes: 8000,
      targetYear: 2030,
      targetCo2Tonnes: 5000,
    });
    // Reduced 2000 tonnes = 20%
    expect(result.reductionPercent).toBeCloseTo(20, 1);
    expect(result.reductionTonnes).toBeCloseTo(2000, 0);
    // Annual rate = 20% / 5 years = 4%/year
    expect(result.annualRatePercent).toBeCloseTo(4, 1);
    expect(result.yearsRemaining).toBe(5);
  });

  it('should determine on-track status', () => {
    const result = esgSummary({
      baselineYear: 2020,
      baselineCo2Tonnes: 10000,
      currentYear: 2025,
      currentCo2Tonnes: 8000,
      targetYear: 2030,
      targetCo2Tonnes: 5000,
    });
    // Need to reduce 3000 more tonnes (30%) in 5 years = 6%/year needed
    // Current rate is 4%/year → not on track
    expect(result.requiredAnnualRate).toBeCloseTo(6, 0);
    expect(result.onTrack).toBe(false);
  });

  it('should detect on-track when ahead of schedule', () => {
    const result = esgSummary({
      baselineYear: 2020,
      baselineCo2Tonnes: 10000,
      currentYear: 2025,
      currentCo2Tonnes: 6000,
      targetYear: 2030,
      targetCo2Tonnes: 5000,
    });
    // Reduced 40% in 5 years = 8%/year
    // Need 10% more in 5 years = 2%/year needed
    expect(result.annualRatePercent).toBeCloseTo(8, 1);
    expect(result.onTrack).toBe(true);
  });

  it('should project future emissions', () => {
    const result = esgSummary({
      baselineYear: 2020,
      baselineCo2Tonnes: 10000,
      currentYear: 2025,
      currentCo2Tonnes: 8000,
      targetYear: 2030,
      targetCo2Tonnes: 5000,
    });
    // Annual reduction = 2000/5 = 400 tonnes/year
    // Projected 2030 = 8000 - 400*5 = 6000
    expect(result.projectedCo2Tonnes).toBeCloseTo(6000, 0);
  });

  it('should handle already achieved target', () => {
    const result = esgSummary({
      baselineYear: 2020,
      baselineCo2Tonnes: 10000,
      currentYear: 2025,
      currentCo2Tonnes: 4000,
      targetYear: 2030,
      targetCo2Tonnes: 5000,
    });
    expect(result.onTrack).toBe(true);
    expect(result.reductionPercent).toBeCloseTo(60, 0);
  });

  it('should handle no reduction (stagnant)', () => {
    const result = esgSummary({
      baselineYear: 2020,
      baselineCo2Tonnes: 10000,
      currentYear: 2025,
      currentCo2Tonnes: 10000,
      targetYear: 2030,
      targetCo2Tonnes: 5000,
    });
    expect(result.reductionPercent).toBeCloseTo(0, 0);
    expect(result.annualRatePercent).toBeCloseTo(0, 0);
    expect(result.onTrack).toBe(false);
  });

  it('should handle emissions increase (negative reduction)', () => {
    const result = esgSummary({
      baselineYear: 2020,
      baselineCo2Tonnes: 10000,
      currentYear: 2025,
      currentCo2Tonnes: 12000,
      targetYear: 2030,
      targetCo2Tonnes: 5000,
    });
    expect(result.reductionPercent).toBeCloseTo(-20, 0);
    expect(result.onTrack).toBe(false);
  });
});
