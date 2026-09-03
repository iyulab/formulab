import type { WbgtInput, WbgtResult, WorkloadIntensity } from './types.js';

/**
 * WBGT limits in degrees Celsius by workload class and acclimatization state.
 *
 * All five classes are verified against ISO 7243:2017, Annex A, Table A.1 ("Valores de
 * referencia de la WBGT para personas aclimatadas y no aclimatadas para cinco clases de
 * tasa metabolica") - the current edition's own reference-value table, read directly from
 * the standard.
 *
 * @reference ISO 7243:2017, Annex A, Table A.1
 *
 * ISO 7243 classifies workload by metabolic rate into five classes, not four - `resting`
 * (Class 0, M < 65 W/m2) has no counterpart in this library's pre-2026-09 enum. That
 * earlier 4-class shape is why `light` and `moderate` used to carry a different, wrong
 * pair of numbers (31/28 and 28/25): they weren't a mislabeled reading of Class 1/Class 2,
 * they were unrelated figures from an unidentified source. All five class/column pairs
 * below are the table's numbers, transcribed as printed:
 *
 *   Class 0 (Resting,    M =  115 W/m2): 33 / 32
 *   Class 1 (Low,        M =  180 W/m2): 30 / 29
 *   Class 2 (Moderate,   M =  300 W/m2): 28 / 26
 *   Class 3 (High,       M =  415 W/m2): 26 / 23
 *   Class 4 (Very High,  M =  520 W/m2): 25 / 20
 *
 * `heavy`/`veryHeavy` (Classes 3/4) are unchanged from the prior, already-correct values.
 * `resting` is new. `light`/`moderate` (Classes 1/2) change from the previous unverified
 * pair to the table's actual Class 1/Class 2 figures.
 */
const WBGT_THRESHOLDS: Record<
  WorkloadIntensity,
  { acclimatized: number; unacclimatized: number }
> = {
  resting: { acclimatized: 33, unacclimatized: 32 },
  light: { acclimatized: 30, unacclimatized: 29 },
  moderate: { acclimatized: 28, unacclimatized: 26 },
  heavy: { acclimatized: 26, unacclimatized: 23 },
  veryHeavy: { acclimatized: 25, unacclimatized: 20 },
};

/**
 * Calculate Wet Bulb Globe Temperature (WBGT) index
 *
 * Outdoor (with solar load):
 *   WBGT = 0.7 x Twb + 0.2 x Tg + 0.1 x Ta
 *
 * Indoor (or outdoor without solar load):
 *   WBGT = 0.7 x Twb + 0.3 x Tg
 *
 * Where:
 * - Twb = Natural Wet Bulb Temperature (C)
 * - Tg = Globe Temperature (C)
 * - Ta = Dry Bulb / Air Temperature (C)
 *
 * The weightings are those of the index itself, not a choice made here.
 *
 * @reference ISO 7243:2017, WBGT index for the assessment of heat stress.
 *
 * Status is determined by comparing WBGT to threshold:
 * - safe: WBGT < threshold - 2
 * - caution: threshold - 2 <= WBGT <= threshold
 * - danger: WBGT > threshold
 *
 * The 2 degree caution band is a margin chosen here, not part of the index - see
 * WBGT_THRESHOLDS above for the threshold table itself.
 *
 * @param input - WBGT input parameters
 * @returns WBGT result with index, threshold, and status
 */
export function wbgtCalculate(input: WbgtInput): WbgtResult {
  const {
    dryBulbTemp,
    wetBulbTemp,
    globeTemp,
    isOutdoor,
    workload,
    isAcclimatized,
  } = input;

  // Calculate WBGT
  let wbgt: number;
  if (isOutdoor) {
    // Outdoor with solar load
    wbgt = 0.7 * wetBulbTemp + 0.2 * globeTemp + 0.1 * dryBulbTemp;
  } else {
    // Indoor or outdoor without solar load
    wbgt = 0.7 * wetBulbTemp + 0.3 * globeTemp;
  }

  // Get threshold based on workload and acclimatization
  const thresholds = WBGT_THRESHOLDS[workload];
  const threshold = isAcclimatized
    ? thresholds.acclimatized
    : thresholds.unacclimatized;

  // Determine status
  let status: 'safe' | 'caution' | 'danger';
  if (wbgt < threshold - 2) {
    status = 'safe';
  } else if (wbgt <= threshold) {
    status = 'caution';
  } else {
    status = 'danger';
  }

  return {
    wbgt,
    threshold,
    status,
  };
}
