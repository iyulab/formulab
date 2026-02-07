import { roundTo } from '../utils.js';
import type { WaterActivityInput, WaterActivityResult } from './types.js';

/**
 * Water Activity Microbial Safety Assessment — HACCP
 *
 * @formula Threshold-based microbial growth risk:
 *   - Bacteria: aw > 0.91
 *   - Yeast: aw > 0.88
 *   - Mold: aw > 0.80
 *   - Xerophilic fungi: aw > 0.65
 *   - Stable (no growth): aw < 0.60
 *
 * @reference FDA Food Code
 * @reference ICMSF "Microorganisms in Foods 6"
 * @reference Scott, W.J. (1957). Water relations of food spoilage microorganisms.
 */
export function waterActivity(input: WaterActivityInput): WaterActivityResult {
  const { aw, temperature = 25 } = input;
  const warnings: string[] = [];

  // Growth risk thresholds
  const bacteria = aw > 0.91;
  const yeast = aw > 0.88;
  const mold = aw > 0.80;
  const xerophilic = aw > 0.65;
  const isStable = aw < 0.60;

  // Risk level
  let riskLevel: WaterActivityResult['riskLevel'];
  if (aw < 0.60) {
    riskLevel = 'safe';
  } else if (aw < 0.80) {
    riskLevel = 'low';
  } else if (aw < 0.91) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'high';
  }

  // Temperature warnings
  if (temperature > 35 && aw > 0.85) {
    warnings.push('Elevated temperature increases microbial growth rate');
  }
  if (bacteria) {
    warnings.push('Pathogenic bacteria can grow (aw > 0.91)');
  }
  if (yeast && !bacteria) {
    warnings.push('Yeast and mold growth possible (aw > 0.88)');
  }
  if (mold && !yeast) {
    warnings.push('Mold growth possible (aw > 0.80)');
  }
  if (xerophilic && !mold) {
    warnings.push('Xerophilic fungi may grow (aw > 0.65)');
  }

  return {
    aw: roundTo(aw, 3),
    isStable,
    riskLevel,
    growthRisk: { bacteria, yeast, mold, xerophilic },
    warnings,
  };
}
