import type { PasteType, ReflowNominalCurve, ReflowSpan } from './types.js';
import { reflowProfile } from './reflow.js';
import { roundTo } from '../utils.js';

const AMBIENT_C = 25;
/** Cooling is drawn below its limit, not at it: three quarters of the maximum rate. */
const COOLING_FRACTION = 0.75;

const mid = (s: ReflowSpan): number => (s.min + s.max) / 2;
const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
const within = (x: number, s: ReflowSpan): boolean => x >= s.min - 1e-9 && x <= s.max + 1e-9;

/**
 * A nominal reflow curve for a solder paste, built from the paste's own windows (`reflowProfile()`):
 * ramp → soak → spike → cool, the ramp-soak-spike shape of a J-STD-020 classification profile.
 *
 * The windows bound a family of curves; this picks one and says how (`assumptions`):
 * - start and end at 25 °C;
 * - ramp (ambient → soak start, soak end → peak) at the middle of the preheat-rate window;
 * - soak linearly across the soak-temperature window;
 * - peak at the middle of the peak window, held flat for `peakDwellS`;
 * - cool at three quarters of the maximum cooling rate;
 * - soak time and time above liquidus as close to the middle of their windows as the total-time window
 *   allows (the total is read as the whole curve, ambient to ambient), moved together when it does not.
 *
 * The result is checked against every window it was built from — ramp time against the preheat time,
 * the ramp's end against the preheat temperature, soak time, time above liquidus, peak, cooling rate,
 * total time — and is never returned outside one.
 *
 * @formula total = ramp + soak + rise + dwell + cool, with dwell = TAL − (Tp − TL)/rate − (Tp − TL)/cooling
 * @reference IPC/JEDEC J-STD-020 (classification reflow profile: ramp, soak, time above liquidus,
 *   peak, ramp-down); the windows are `reflowProfile()`'s.
 * @units °C, s, °C/s
 * @param pasteType - The type of solder paste
 * @returns Curve points in time order, the liquidus crossings, and the assumptions behind them.
 * @throws {RangeError} a paste type that is not one of `getPasteTypes()`
 * @throws {Error} the paste's windows admit no curve of this shape (a window table defect, not an input error)
 */
export function reflowNominalCurve(pasteType: PasteType): ReflowNominalCurve {
  const profile = reflowProfile(pasteType);
  const w = profile.profile;
  const liquidus = profile.meltingPoint;
  const fail = (what: string): never => {
    throw new Error(`reflowNominalCurve(${pasteType}): ${what}`);
  };

  const rate = mid(w.preheatRateCPerS);
  const peak = mid(w.peakTempC);
  const cooling = w.coolingRateMaxCPerS * COOLING_FRACTION;
  const soakStart = w.soakTempC.min;
  const soakEnd = w.soakTempC.max;
  // The liquidus is crossed on the way up to the peak, after the soak.
  if (!(soakEnd <= liquidus && liquidus < peak)) fail('the soak must end at or below the liquidus, and the peak lie above it');

  const ramp = (soakStart - AMBIENT_C) / rate;
  const rise = (peak - soakEnd) / rate;
  const riseAbove = (peak - liquidus) / rate;
  const fallAbove = (peak - liquidus) / cooling;
  const cool = (peak - AMBIENT_C) / cooling;
  // total = fixed + soak + TAL
  const fixed = ramp + rise + cool - riseAbove - fallAbove;

  const soakBox: ReflowSpan = w.soakTimeS;
  const talBox: ReflowSpan = { min: Math.max(w.timeAboveLiquidusS.min, riseAbove + fallAbove), max: w.timeAboveLiquidusS.max };
  if (talBox.min > talBox.max) fail('the time above liquidus cannot be reached at this ramp and cooling rate');
  const sumLo = w.totalProfileTimeS.min - fixed;
  const sumHi = w.totalProfileTimeS.max - fixed;

  let soak = mid(soakBox);
  let tal = mid(talBox);
  const sum = soak + tal;
  const target = clamp(sum, sumLo, sumHi);
  if (target !== sum) {
    // Move both toward the total window equally; what one cannot take (its window edge), the other does.
    const d = target - sum;
    const soakMoved = clamp(soak + d / 2, soakBox.min, soakBox.max);
    tal = clamp(tal + (d - (soakMoved - soak)), talBox.min, talBox.max);
    soak = clamp(target - tal, soakBox.min, soakBox.max);
  }

  const dwell = tal - riseAbove - fallAbove;
  const total = fixed + soak + tal;
  const checks: [boolean, string][] = [
    [within(ramp, w.preheatTimeS), `ramp ${ramp} s outside the preheat time`],
    [within(soakStart, w.preheatTempC), `ramp end ${soakStart} °C outside the preheat temperature`],
    [within(soak, w.soakTimeS), `soak ${soak} s outside its window`],
    [within(tal, w.timeAboveLiquidusS), `time above liquidus ${tal} s outside its window`],
    [dwell >= -1e-9, 'negative peak dwell'],
    [within(total, w.totalProfileTimeS), `total ${total} s outside its window`],
  ];
  for (const [ok, what] of checks) if (!ok) fail(what);

  const tSoakStart = ramp;
  const tSoakEnd = tSoakStart + soak;
  const tPeak = tSoakEnd + rise;
  const tPeakEnd = tPeak + dwell;
  const tEnd = tPeakEnd + cool;
  const t = (x: number): number => roundTo(x, 1);

  return {
    pasteType: profile.pasteType,
    points: [
      { timeS: 0, tempC: AMBIENT_C },
      { timeS: t(tSoakStart), tempC: soakStart },
      { timeS: t(tSoakEnd), tempC: soakEnd },
      { timeS: t(tPeak), tempC: peak },
      { timeS: t(tPeakEnd), tempC: peak },
      { timeS: t(tEnd), tempC: AMBIENT_C },
    ],
    liquidusC: liquidus,
    liquidusUpS: t(tPeak - riseAbove),
    liquidusDownS: t(tPeakEnd + fallAbove),
    assumptions: {
      ambientC: AMBIENT_C,
      rampRateCPerS: rate,
      soakTimeS: t(soak),
      peakC: peak,
      peakDwellS: t(dwell),
      coolingRateCPerS: roundTo(cooling, 2),
      timeAboveLiquidusS: t(tal),
      totalTimeS: t(total),
    },
  };
}
