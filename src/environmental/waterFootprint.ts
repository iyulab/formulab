import { roundTo } from '../utils.js';
import type { WaterFootprintInput, WaterFootprintResult } from './types.js';

/**
 * Calculate water footprint (blue, green, grey)
 *
 * @formula total = blue + green + grey
 * @reference Water Footprint Network, ISO 14046
 * @param input - Blue, green, grey water volumes
 * @returns Total water footprint with percentage breakdown
 */
export function waterFootprint(input: WaterFootprintInput): WaterFootprintResult {
  const { blueWaterM3, greenWaterM3, greyWaterM3, productionUnits } = input;

  const totalWaterM3 = roundTo(blueWaterM3 + greenWaterM3 + greyWaterM3, 2);
  const bluePercent = roundTo((blueWaterM3 / totalWaterM3) * 100, 1);
  const greenPercent = roundTo((greenWaterM3 / totalWaterM3) * 100, 1);
  const greyPercent = roundTo((greyWaterM3 / totalWaterM3) * 100, 1);

  const perUnitM3 = productionUnits != null && productionUnits > 0
    ? roundTo(totalWaterM3 / productionUnits, 4)
    : undefined;

  return { totalWaterM3, bluePercent, greenPercent, greyPercent, perUnitM3 };
}
