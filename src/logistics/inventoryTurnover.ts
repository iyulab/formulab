import { roundTo, requireFinite } from '../utils.js';
import type { InventoryTurnoverInput, InventoryTurnoverResult } from './types.js';
import { inputRangeError } from '../errors.js';

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
    throw inputRangeError('periodDays must be greater than 0', {
      code: 'parameter_out_of_range', parameter: 'periodDays', exclusive_min: 0, got: periodDays,
    });
  }
  // A cost of goods sold and a stock level are amounts; a negative one flips every ratio.
  if (!(cogs >= 0)) {
    throw inputRangeError('cogs must not be negative', {
      code: 'parameter_out_of_range', parameter: 'cogs', min: 0, got: cogs,
    });
  }
  if (!(averageInventory >= 0)) {
    throw inputRangeError('averageInventory must not be negative', {
      code: 'parameter_out_of_range', parameter: 'averageInventory', min: 0, got: averageInventory,
    });
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
