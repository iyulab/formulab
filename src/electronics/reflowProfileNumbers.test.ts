import { describe, it, expect } from 'vitest';
import { reflowProfile, getPasteTypes } from './reflow.js';

// The range strings as published before the numeric `profile` existed (and before the strings were
// dropped from the result) — the golden for the numbers: each must read back to exactly these.
const PUBLISHED = {
  sac305: ['SAC305', 217, '1.0-3.0', '150-200', '60-120', '150-200', '60-120', '235-250', '60-90', '<4.0', '240-300'],
  sn63pb37: ['Sn63Pb37', 183, '1.0-2.5', '100-150', '60-90', '150-183', '60-90', '210-230', '45-75', '<4.0', '180-240'],
  sac387: ['SAC387', 217, '1.0-3.0', '150-200', '60-120', '150-200', '60-120', '240-260', '60-90', '<4.0', '240-300'],
  snbi58: ['SnBi58', 138, '0.5-2.0', '80-120', '60-90', '100-130', '60-90', '160-180', '30-60', '<3.0', '180-240'],
} as const;

describe('reflowProfile numeric profile', () => {
  it.each(getPasteTypes())('%s carries exactly the published windows', (paste) => {
    const r = reflowProfile(paste)!;
    const p = r.profile;
    const range = (s: { min: number; max: number }, digits = 0) => `${s.min.toFixed(digits)}-${s.max.toFixed(digits)}`;
    expect([r.pasteType, r.meltingPoint, range(p.preheatRateCPerS, 1), range(p.preheatTempC), range(p.preheatTimeS),
      range(p.soakTempC), range(p.soakTimeS), range(p.peakTempC), range(p.timeAboveLiquidusS),
      `<${p.coolingRateMaxCPerS.toFixed(1)}`, range(p.totalProfileTimeS)]).toEqual([...PUBLISHED[paste]]);
  });

  it.each(getPasteTypes())('%s windows are ordered and reflow the paste', (paste) => {
    const r = reflowProfile(paste)!;
    const p = r.profile;
    for (const s of [p.preheatTempC, p.soakTempC, p.peakTempC, p.totalProfileTimeS]) expect(s.min).toBeLessThan(s.max);
    // The peak must clear the melting point — the profile reflows the paste it names.
    expect(p.peakTempC.min).toBeGreaterThan(r.meltingPoint);
  });

  it('refuses an unknown paste type, including an inherited key', () => {
    expect(() => reflowProfile('unknown' as never)).toThrow(RangeError);
    expect(() => reflowProfile('toString' as never)).toThrow(RangeError);
  });
});
