import type { WbgtInput, WbgtResult, WorkloadIntensity } from './types.js';

// WBGT threshold values based on workload and acclimatization status
// Based on ACGIH TLV guidelines
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
 * Status is determined by comparing WBGT to threshold:
 * - safe: WBGT < threshold - 2
 * - caution: threshold - 2 <= WBGT <= threshold
 * - danger: WBGT > threshold
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
