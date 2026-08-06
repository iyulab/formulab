import type { WbgtInput, WbgtResult, WorkloadIntensity } from './types.js';

/**
 * WBGT limits in degrees Celsius by workload and acclimatization state.
 *
 * ⚠️ Unlike the index formula below, these figures carry no verified source. They have
 * long been described here as threshold limit values, but the published table they would
 * come from is not freely available, so the attribution could not be confirmed - neither
 * the numbers themselves nor which column belongs to acclimatized workers. Several
 * schemes publish limits on this shape with values a degree or two apart, and they are
 * stated on different bases (some as a limit, some as an action level).
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
 * threshold it is measured from is itself unverified - see WBGT_THRESHOLDS above.
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
