import { describe, it, expect } from 'vitest';
import { bendAllowance } from './metal/bendAllowance.js';
import { flatPattern } from './metal/flatPattern.js';
import { pressTonnage } from './metal/pressTonnage.js';
import { confinedSpace } from './safety/confinedSpace.js';
import { fallClearance } from './safety/fallClearance.js';
import { ladderAngle } from './safety/ladderAngle.js';
import { waterActivity } from './food/waterActivity.js';
import type { Diagnostic } from './diagnostics.js';

/** Every warning has its data twin, in the same order. */
function inStep(r: { warnings: string[]; diagnostics: Diagnostic[] }): Diagnostic[] {
  expect(r.diagnostics).toHaveLength(r.warnings.length);
  return r.diagnostics;
}

describe('diagnostics — warnings as data, one for one', () => {
  it('bendAllowance: a radius below the minimum and an extreme angle', () => {
    const d = inStep(bendAllowance({ thickness: 3, insideRadius: 0.5, bendAngle: 175, material: 'aluminum6061' }));
    expect(d[0]).toMatchObject({ code: 'bend_radius_below_minimum', parameter: 'insideRadius', got: 0.5 });
    expect(d[0].min).toBeGreaterThan(0.5);
    expect(d[1]).toEqual({ code: 'bend_angle_extreme', parameter: 'bendAngle', got: 175, max: 170 });
  });

  it('flatPattern now reports the extreme angle itself', () => {
    const r = flatPattern({ shapeType: 'lShape', thickness: 2, insideRadius: 2, bendAngle: 175, flangeA: 300, flangeB: 300 });
    expect(inStep(r)).toEqual([{ code: 'bend_angle_extreme', parameter: 'bendAngle', got: 175, max: 170 }]);
    const ok = flatPattern({ shapeType: 'lShape', thickness: 2, insideRadius: 2, bendAngle: 90, flangeA: 50, flangeB: 50 });
    expect(ok.warnings).toEqual([]);
    expect(ok.diagnostics).toEqual([]);
  });

  it('pressTonnage: a draw below the safe limit needing several draws', () => {
    const r = pressTonnage({
      operation: 'drawing', thickness: 1, tensileStrength: 400, shearStrength: 300, blankDiameter: 200, punchDiameter: 80,
    });
    const codes = inStep(r).map((x) => x.code);
    expect(codes).toContain('draw_ratio_below_limit');
    expect(codes).toContain('multiple_draws_required');
    expect(r.diagnostics.find((x) => x.code === 'multiple_draws_required')?.count).toBe(r.numberOfDraws);
  });

  it('confinedSpace: each reading names itself and the limit it crossed', () => {
    const r = confinedSpace({ oxygenPercent: 18, lelPercent: 30, h2sPpm: 150, coPpm: 30 });
    expect(inStep(r)).toEqual([
      { code: 'oxygen_deficient', parameter: 'oxygenPercent', got: 18, min: 19.5 },
      { code: 'gas_above_limit', parameter: 'lelPercent', got: 30, max: 25 },
      { code: 'gas_idlh', parameter: 'h2sPpm', got: 150, max: 100 },
      { code: 'gas_elevated', parameter: 'coPpm', got: 30, max: 25 },
    ]);
  });

  it('fallClearance: free fall over the OSHA limit', () => {
    const r = fallClearance({
      lanyardLength: 1.8288, decelerationDistance: 1.0668, harnessStretch: 0.3048, dRingHeight: 1.524,
      anchorAboveFeet: 0, safetyFactor: 0.9144, workingHeight: 6, obstacleHeight: 0,
    });
    const d = inStep(r).find((x) => x.code === 'free_fall_exceeds_limit');
    expect(d).toMatchObject({ parameter: 'freeFallDistance', max: 1.829 });
    expect(d!.got).toBeGreaterThan(1.829);
  });

  it('ladderAngle: too shallow', () => {
    const r = ladderAngle({ ladderLength: 6, baseDistance: 3 });
    expect(inStep(r)[0]).toMatchObject({ code: 'ladder_angle_too_shallow', parameter: 'angle', min: 70 });
  });

  it('waterActivity: the organisms that can grow', () => {
    const r = waterActivity({ aw: 0.95, temperature: 37 } as Parameters<typeof waterActivity>[0]);
    expect(inStep(r).map((x) => x.code)).toEqual(['temperature_elevated', 'pathogen_growth_possible']);
  });
});
