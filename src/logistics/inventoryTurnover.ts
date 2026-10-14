import { roundTo, requireFinite } from '../utils.js';
import type { InventoryTurnoverInput, InventoryTurnoverResult } from './types.js';

/**
 * Calculate inventory turnover metrics.
 *
 * turnoverRatio = COGS / avgInventory
 * daysOfSupply = periodDays × avgInventory / COGS  (= periodDays / turnoverRatio)
 * gmroii = grossMargin / avgInventory × 100
 *
 * @param input - COGS, average inventory, and optional gross margin
 * @returns Turnover ratio, days/weeks of supply, and GMROII. With no average inventory the
 *   turnover and GMROII have no value (`null`) and there are 0 days of supply; with no COGS the
 *   turnover is 0 and the stock never runs out, so days/weeks of supply are `null`
 * @throws {RangeError} periodDays is not greater than 0, or cogs or averageInventory is negative
 */
export function inventoryTurnover(input: InventoryTurnoverInput): InventoryTurnoverResult {
  requireFinite('inventoryTurnover', input);
  const {
    cogs,
    averageInventory,
    periodDays = 365,
    grossMargin,
  } = input;

  // Days of supply is the period divided by the turnover; a negative period flips its sign.
  if (!(periodDays > 0)) {
    throw new RangeError('periodDays must be greater than 0');
  }
  // A cost of goods sold and a stock level are amounts; a negative one flips every ratio.
  if (!(cogs >= 0)) {
    throw new RangeError('cogs must not be negative');
  }
  if (!(averageInventory >= 0)) {
    throw new RangeError('averageInventory must not be negative');
  }

  // Nothing in stock: no ratio to stock, and nothing to supply from.
  const turnoverRatio = averageInventory > 0 ? cogs / averageInventory : null;
  // Nothing sold: the stock never runs out.
  const daysOfSupply = cogs > 0 ? (periodDays * averageInventory) / cogs : null;
  const weeksOfSupply = daysOfSupply === null ? null : daysOfSupply / 7;

  let gmroii: number | null = null;
  if (grossMargin !== undefined && averageInventory > 0) {
    gmroii = (grossMargin / averageInventory) * 100;
  }

  return {
    turnoverRatio: turnoverRatio === null ? null : roundTo(turnoverRatio, 4),
    daysOfSupply: daysOfSupply === null ? null : roundTo(daysOfSupply, 4),
    weeksOfSupply: weeksOfSupply === null ? null : roundTo(weeksOfSupply, 4),
    gmroii: gmroii !== null ? roundTo(gmroii, 4) : null,
  };
}
