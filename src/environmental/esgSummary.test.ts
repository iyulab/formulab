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

// ERRORS.md guarantees no NaN/Infinity in output fields; these inputs used to
// produce them instead of throwing.
describe('esgSummary input domain', () => {
  it('rejects a zero baseline that would make an output non-finite', () => {
    expect(() => esgSummary({ baselineYear: 2020, baselineCo2Tonnes: 0, currentYear: 2024, currentCo2Tonnes: 800, targetYear: 2030, targetCo2Tonnes: 500 } as never)).toThrow(RangeError);
  });

  it('rejects a reading taken before its own baseline', () => {
    expect(() => esgSummary({ baselineYear: 2025, baselineCo2Tonnes: 1000, currentYear: 2024, currentCo2Tonnes: 800, targetYear: 2030, targetCo2Tonnes: 500 })).toThrow(/before baselineYear/);
  });
});

// A rate needs a span of years; a missing span is «no value», never a 0 % rate.
describe('esgSummary without a span of years', () => {
  it('has no trend in the baseline year itself', () => {
    const result = esgSummary({ baselineYear: 2025, baselineCo2Tonnes: 1000, currentYear: 2025, currentCo2Tonnes: 1000, targetYear: 2030, targetCo2Tonnes: 500 });
    expect(result.annualRatePercent).toBeNull();
    expect(result.projectedCo2Tonnes).toBeNull();
    expect(result.requiredAnnualRate).toBe(10);
    expect(result.onTrack).toBeNull();
  });

  it('needs no further rate once the target year is reached', () => {
    const result = esgSummary({ baselineYear: 2020, baselineCo2Tonnes: 1000, currentYear: 2030, currentCo2Tonnes: 700, targetYear: 2030, targetCo2Tonnes: 500 });
    expect(result.requiredAnnualRate).toBeNull();
    expect(result.projectedCo2Tonnes).toBe(700);
    expect(result.annualRatePercent).toBe(3);
    expect(result.onTrack).toBe(false);
  });

  it('has nothing to project past the target year, and judges by the reading', () => {
    const missed = esgSummary({ baselineYear: 2018, baselineCo2Tonnes: 1000, currentYear: 2026, currentCo2Tonnes: 700, targetYear: 2025, targetCo2Tonnes: 500 });
    expect(missed.yearsRemaining).toBe(-1);
    expect(missed.requiredAnnualRate).toBeNull();
    expect(missed.projectedCo2Tonnes).toBeNull();
    expect(missed.onTrack).toBe(false);
    const met = esgSummary({ baselineYear: 2018, baselineCo2Tonnes: 1000, currentYear: 2026, currentCo2Tonnes: 400, targetYear: 2025, targetCo2Tonnes: 500 });
    expect(met.onTrack).toBe(true);
  });

});

describe('esgSummary coded refusals', () => {
  it('bounds currentYear by baselineYear', () => {
    expect(() => esgSummary({ baselineYear: 2025, baselineCo2Tonnes: 1000, currentYear: 2024, currentCo2Tonnes: 800, targetYear: 2030, targetCo2Tonnes: 500 })).toThrow(expect.objectContaining({ code: 'parameter_out_of_range', parameter: 'currentYear', min: 2025, got: 2024 }));
  });
});
