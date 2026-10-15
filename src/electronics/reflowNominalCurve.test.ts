import { describe, it, expect } from 'vitest';
import { reflowNominalCurve } from './reflowNominalCurve.js';
import { reflowProfile, getPasteTypes } from './reflow.js';
import type { PasteType } from './types.js';

/** Temperature of the piecewise-linear curve at time t. */
function tempAt(points: { timeS: number; tempC: number }[], t: number): number {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (t <= b.timeS) return a.tempC + ((b.tempC - a.tempC) * (t - a.timeS)) / (b.timeS - a.timeS);
  }
  return points[points.length - 1].tempC;
}

describe('reflowNominalCurve', () => {
  describe.each(getPasteTypes())('%s: the curve lies inside every window of its paste', (paste) => {
    const curve = reflowNominalCurve(paste);
    const w = reflowProfile(paste).profile;
    const [start, soakStart, soakEnd, peak, peakEnd, end] = curve.points;

    it('starts and ends at ambient, points in time order', () => {
      expect(start).toEqual({ timeS: 0, tempC: 25 });
      expect(end.tempC).toBe(25);
      for (let i = 1; i < curve.points.length; i++) {
        expect(curve.points[i].timeS).toBeGreaterThanOrEqual(curve.points[i - 1].timeS);
      }
    });

    it('ramp: rate, time and end temperature inside the preheat windows', () => {
      const rate = (soakStart.tempC - start.tempC) / (soakStart.timeS - start.timeS);
      expect(rate).toBeGreaterThanOrEqual(w.preheatRateCPerS.min);
      expect(rate).toBeLessThanOrEqual(w.preheatRateCPerS.max + 0.01);
      expect(soakStart.timeS).toBeGreaterThanOrEqual(w.preheatTimeS.min - 0.05);
      expect(soakStart.timeS).toBeLessThanOrEqual(w.preheatTimeS.max + 0.05);
      expect(soakStart.tempC).toBeGreaterThanOrEqual(w.preheatTempC.min);
      expect(soakStart.tempC).toBeLessThanOrEqual(w.preheatTempC.max);
    });

    it('soak: across the soak-temperature window, for a time inside the soak-time window', () => {
      expect(soakStart.tempC).toBe(w.soakTempC.min);
      expect(soakEnd.tempC).toBe(w.soakTempC.max);
      const soak = soakEnd.timeS - soakStart.timeS;
      expect(soak).toBeGreaterThanOrEqual(w.soakTimeS.min - 0.1);
      expect(soak).toBeLessThanOrEqual(w.soakTimeS.max + 0.1);
    });

    it('peak inside the peak window, held for a non-negative dwell', () => {
      expect(peak.tempC).toBeGreaterThanOrEqual(w.peakTempC.min);
      expect(peak.tempC).toBeLessThanOrEqual(w.peakTempC.max);
      expect(peakEnd.tempC).toBe(peak.tempC);
      expect(peakEnd.timeS).toBeGreaterThanOrEqual(peak.timeS);
    });

    it('time above liquidus, measured on the curve, inside its window', () => {
      expect(tempAt(curve.points, curve.liquidusUpS)).toBeCloseTo(curve.liquidusC, 0);
      expect(tempAt(curve.points, curve.liquidusDownS)).toBeCloseTo(curve.liquidusC, 0);
      const tal = curve.liquidusDownS - curve.liquidusUpS;
      expect(tal).toBeGreaterThanOrEqual(w.timeAboveLiquidusS.min - 0.2);
      expect(tal).toBeLessThanOrEqual(w.timeAboveLiquidusS.max + 0.2);
    });

    it('cooling no faster than the maximum, total inside the total-time window', () => {
      const coolRate = (peakEnd.tempC - end.tempC) / (end.timeS - peakEnd.timeS);
      expect(coolRate).toBeLessThanOrEqual(w.coolingRateMaxCPerS);
      expect(end.timeS).toBeGreaterThanOrEqual(w.totalProfileTimeS.min - 0.1);
      expect(end.timeS).toBeLessThanOrEqual(w.totalProfileTimeS.max + 0.1);
    });

    it('assumptions describe the curve that was drawn', () => {
      const a = curve.assumptions;
      expect(a.peakC).toBe(peak.tempC);
      expect(a.totalTimeS).toBeCloseTo(end.timeS, 0);
      expect(a.peakDwellS).toBeCloseTo(peakEnd.timeS - peak.timeS, 0);
      expect(a.coolingRateCPerS).toBeCloseTo(w.coolingRateMaxCPerS * 0.75, 2);
    });
  });

  it('SAC305 worked numbers: 2 °C/s ramp, 150→200 °C soak, 242.5 °C peak, 3 °C/s cooling', () => {
    const c = reflowNominalCurve('sac305');
    expect(c.assumptions).toMatchObject({ ambientC: 25, rampRateCPerS: 2, peakC: 242.5, coolingRateCPerS: 3 });
    // ramp (150 − 25) / 2 = 62.5 s
    expect(c.points[1]).toEqual({ timeS: 62.5, tempC: 150 });
    // soak 90 s and TAL 75 s (both mid-window) give 300 s — the top of the 240–300 s total window, so kept
    expect(c.assumptions.soakTimeS).toBe(90);
    expect(c.assumptions.timeAboveLiquidusS).toBe(75);
    expect(c.assumptions.totalTimeS).toBe(300);
  });

  it('Sn63Pb37: mid-window soak and TAL overshoot the 240 s total, so both are shortened together', () => {
    const c = reflowNominalCurve('sn63pb37');
    const w = reflowProfile('sn63pb37').profile;
    expect(c.assumptions.totalTimeS).toBeLessThanOrEqual(w.totalProfileTimeS.max + 0.1);
    expect(c.assumptions.soakTimeS).toBeLessThan((w.soakTimeS.min + w.soakTimeS.max) / 2);
    expect(c.assumptions.timeAboveLiquidusS).toBeLessThan((w.timeAboveLiquidusS.min + w.timeAboveLiquidusS.max) / 2);
  });

  it('throws on an unknown paste type, as reflowProfile does', () => {
    expect(() => reflowNominalCurve('lead-free' as PasteType)).toThrow(RangeError);
  });
});
