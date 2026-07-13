import { roundTo } from '../utils.js';
import type { WaterFootprintInput, WaterFootprintResult } from './types.js';

/**
 * Calculate water footprint (blue, green, grey)
 *
 * @formula total = blue + green + grey
 * @reference Water Footprint Network, ISO 14046
 * @param input - Blue, green, grey water volumes
 * @returns Total water footprint with percentage breakdown. An all-zero footprint is
 *   valid-but-degenerate: percentages are reported as 0.
 * @throws {RangeError} any water volume < 0
 */
export function waterFootprint(input: WaterFootprintInput): WaterFootprintResult {
  const { blueWaterM3, greenWaterM3, greyWaterM3, productionUnits } = input;

  if (blueWaterM3 < 0 || greenWaterM3 < 0 || greyWaterM3 < 0) {
    throw new RangeError('water volumes must not be negative');
  }

  const totalWaterM3 = roundTo(blueWaterM3 + greenWaterM3 + greyWaterM3, 2);
  // totalWaterM3 = 0 is valid-but-degenerate — report 0%, not NaN
  const pct = (v: number) => totalWaterM3 > 0 ? roundTo((v / totalWaterM3) * 100, 1) : 0;
  const bluePercent = pct(blueWaterM3);
  const greenPercent = pct(greenWaterM3);
  const greyPercent = pct(greyWaterM3);

  const perUnitM3 = productionUnits != null && productionUnits > 0
    ? roundTo(totalWaterM3 / productionUnits, 4)
    : undefined;

  return { totalWaterM3, bluePercent, greenPercent, greyPercent, perUnitM3 };
}
