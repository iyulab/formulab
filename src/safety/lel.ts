import { roundTo } from '../utils.js';
import type { LelInput, LelResult } from './types.js';

/**
 * LEL (Lower Explosive Limit) for Mixed Gases — Le Chatelier's Rule
 *
 * @formula
 *   - LEL_mix = 1 / Σ(yi / LELi)
 *   - yi = concentration_i / total_concentration (mole fraction)
 *   - %LEL = totalConcentration / LEL_mix × 100
 *
 * @reference Le Chatelier, H. (1891). Estimation of Firedamp by Flammability Limits.
 * @reference NFPA 69 — Standard on Explosion Prevention Systems
 */
export function lel(input: LelInput): LelResult {
  const { gases } = input;

  const totalConcentration = gases.reduce((s, g) => s + g.concentration, 0);

  if (totalConcentration === 0 || gases.length === 0) {
    return {
      mixtureLel: 0,
      totalConcentration: 0,
      percentOfLel: 0,
      status: 'safe',
      safetyMargin: 0,
      contributions: gases.map(g => ({ name: g.name, fraction: 0 })),
    };
  }

  // Le Chatelier's rule: 1 / Σ(yi / LELi)
  let sumFractionOverLel = 0;
  const contributions: { name: string; fraction: number }[] = [];

  for (const gas of gases) {
    const yi = gas.concentration / totalConcentration;
    if (gas.lel > 0) {
      sumFractionOverLel += yi / gas.lel;
    }
    contributions.push({
      name: gas.name,
      fraction: roundTo(yi * 100, 2),
    });
  }

  const mixtureLel = sumFractionOverLel > 0 ? 1 / sumFractionOverLel : 0;
  const percentOfLel = mixtureLel > 0
    ? (totalConcentration / mixtureLel) * 100
    : 0;

  const safetyMargin = mixtureLel > 0
    ? mixtureLel - totalConcentration
    : 0;

  // Status
  let status: LelResult['status'];
  if (percentOfLel < 25) {
    status = 'safe';
  } else if (percentOfLel < 50) {
    status = 'caution';
  } else {
    status = 'danger';
  }

  return {
    mixtureLel: roundTo(mixtureLel, 4),
    totalConcentration: roundTo(totalConcentration, 4),
    percentOfLel: roundTo(percentOfLel, 2),
    status,
    safetyMargin: roundTo(safetyMargin, 4),
    contributions,
  };
}
