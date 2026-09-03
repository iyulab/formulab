import type { WbgtInput, WbgtResult, WorkloadIntensity } from './types.js';

/**
 * WBGT limits in degrees Celsius by workload and acclimatization state.
 *
 * `heavy` and `veryHeavy` are verified against ISO 7243 Table 1 (metabolic rate classes
 * 200 < M < 260 W/m2 and M > 260 W/m2 respectively), using the table's "sensible air
 * movement" column - the bracketed alternate values the standard gives for those two
 * classes. Source: Parsons K (2006), "Heat Stress Standard ISO 7243 and its Global
 * Application", Industrial Health 44, 368-379, Table 1 (a peer-reviewed reproduction of
 * the standard's table, cited, since the standard itself is not freely available).
 *
 * @reference ISO 7243, Table 1 (via Parsons 2006, Table 1) - heavy/veryHeavy only
 *
 * ⚠️ `light` and `moderate` remain unverified. They do not match ISO 7243 Table 1's
 * Light (65 < M < 130 W/m2) or Moderate (130 < M < 200 W/m2) rows (30/29 and 28/26
 * respectively), nor ACGIH's TLV table (Table 6 in the same source: continuous-work
 * columns 30.0/26.7 for light/moderate) reproduced alongside it. The published table
 * these two figures would come from is still not identified, so neither the numbers
 * nor which column is acclimatized is confirmed for them.
 *
 * ISO 7243 also has a fifth, lower metabolic class ("Resting", M < 65 W/m2) that this
 * 4-class enum has no slot for - the mismatch on light/moderate may in part be a
 * consequence of that missing class rather than a wrong pair of numbers, but this has
 * not been established.
 *
 * They are left unchanged, because substituting one unverified figure for another is not
 * an improvement. Treat a status returned from them as a screening indication and check
 * it against whichever scheme applies where the work is done, rather than as a limit.
 */
const WBGT_THRESHOLDS: Record<
  WorkloadIntensity,
  { acclimatized: number; unacclimatized: number }
> = {
  light: { acclimatized: 31, unacclimatized: 28 },
  moderate: { acclimatized: 28, unacclimatized: 25 },
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
 * The 2 degree caution band is a margin chosen here, not part of the index, and the
 * threshold it is measured from is only partly verified - see WBGT_THRESHOLDS above.
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
