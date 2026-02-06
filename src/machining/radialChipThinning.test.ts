import { describe, it, expect } from 'vitest';
import { radialChipThinning } from './radialChipThinning.js';

describe('radialChipThinning', () => {
  it('should compute thinning factor = 1 when ae = D/2 (slotting)', () => {
    const result = radialChipThinning({
      toolDiameter: 10,
      radialDepthOfCut: 5, // ae = D/2, no thinning
      chipLoadTarget: 0.05,
    });

    // factor = 10 / (2 × √(5 × 5)) = 10/10 = 1
    expect(result.chipThinningFactor).toBe(1);
    expect(result.adjustedFeedPerTooth).toBeCloseTo(0.05, 4);
  });

  it('should compute factor > 1 when ae < D/2', () => {
    const result = radialChipThinning({
      toolDiameter: 10,
      radialDepthOfCut: 1,
      chipLoadTarget: 0.05,
    });

    // factor = 10 / (2 × √(1 × 9)) = 10 / (2 × 3) = 1.6667
    expect(result.chipThinningFactor).toBeCloseTo(1.6667, 3);
    expect(result.adjustedFeedPerTooth).toBeCloseTo(0.0833, 3);
  });

  it('should handle 25% radial engagement', () => {
    const result = radialChipThinning({
      toolDiameter: 20,
      radialDepthOfCut: 5, // 25% of D
      chipLoadTarget: 0.1,
    });

    // factor = 20 / (2 × √(5 × 15)) = 20 / (2 × 8.6603) = 1.1547
    expect(result.chipThinningFactor).toBeCloseTo(1.1547, 3);
    expect(result.adjustedFeedPerTooth).toBeCloseTo(0.1155, 3);
  });

  it('should produce higher factor for smaller ae', () => {
    const wide = radialChipThinning({
      toolDiameter: 10, radialDepthOfCut: 4, chipLoadTarget: 0.05,
    });
    const narrow = radialChipThinning({
      toolDiameter: 10, radialDepthOfCut: 1, chipLoadTarget: 0.05,
    });

    expect(narrow.chipThinningFactor).toBeGreaterThan(wide.chipThinningFactor);
  });

  it('should preserve effective chip load as the target', () => {
    const result = radialChipThinning({
      toolDiameter: 12,
      radialDepthOfCut: 2,
      chipLoadTarget: 0.08,
    });

    expect(result.effectiveChipLoad).toBe(0.08);
  });
});
