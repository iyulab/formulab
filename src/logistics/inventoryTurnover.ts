import { roundTo } from '../utils.js';
import type { InventoryTurnoverInput, InventoryTurnoverResult } from './types.js';

/**
 * Calculate inventory turnover metrics.
 *
 * turnoverRatio = COGS / avgInventory
 * daysOfSupply = periodDays / turnoverRatio
 * gmroii = grossMargin / avgInventory × 100
 *
 * @param input - COGS, average inventory, and optional gross margin
 * @returns Turnover ratio, days/weeks of supply, and GMROII
 */
export function inventoryTurnover(input: InventoryTurnoverInput): InventoryTurnoverResult {
  const {
    cogs,
    averageInventory,
    periodDays = 365,
    grossMargin,
  } = input;

  if (averageInventory <= 0 || cogs <= 0) {
    return {
      turnoverRatio: 0,
      daysOfSupply: 0,
      weeksOfSupply: 0,
      gmroii: null,
    };
  }

  const turnoverRatio = cogs / averageInventory;
  const daysOfSupply = periodDays / turnoverRatio;
  const weeksOfSupply = daysOfSupply / 7;

  let gmroii: number | null = null;
  if (grossMargin !== undefined) {
    gmroii = (grossMargin / averageInventory) * 100;
  }

  return {
    turnoverRatio: roundTo(turnoverRatio, 4),
    daysOfSupply: roundTo(daysOfSupply, 4),
    weeksOfSupply: roundTo(weeksOfSupply, 4),
    gmroii: gmroii !== null ? roundTo(gmroii, 4) : null,
  };
}
