import { roundTo } from '../utils.js';
import type { DepreciationInput, DepreciationResult, DepreciationYearEntry } from './types.js';

/**
 * Depreciation schedule by straight-line or declining-balance method.
 *
 * @param input - Asset cost, salvage value, useful life, and method
 * @returns Annual depreciation, year-by-year schedule, and total depreciation
 * @throws RangeError if assetCost <= 0, salvageValue < 0, usefulLife <= 0,
 *   salvageValue >= assetCost, or method is unknown
 */
export function depreciation(input: DepreciationInput): DepreciationResult {
  const { assetCost, salvageValue, usefulLife, method } = input;
  if (assetCost <= 0) throw new RangeError(`assetCost must be > 0, got ${assetCost}`);
  if (salvageValue < 0) throw new RangeError(`salvageValue must be >= 0, got ${salvageValue}`);
  if (usefulLife <= 0) throw new RangeError(`usefulLife must be > 0, got ${usefulLife}`);
  if (salvageValue >= assetCost) {
    throw new RangeError(`salvageValue must be less than assetCost, got salvageValue=${salvageValue}, assetCost=${assetCost}`);
  }

  if (method === 'straight-line') {
    return straightLine(assetCost, salvageValue, usefulLife);
  }
  if (method === 'declining-balance') {
    return decliningBalance(assetCost, salvageValue, usefulLife);
  }
  throw new RangeError(`method must be 'straight-line' or 'declining-balance', got ${String(method)}`);
}

function straightLine(cost: number, salvage: number, life: number): DepreciationResult {
  const annual = (cost - salvage) / life;
  const schedule: DepreciationYearEntry[] = [];

  for (let year = 1; year <= life; year++) {
    schedule.push({
      year,
      depreciation: roundTo(annual, 6),
      accumulatedDepreciation: roundTo(annual * year, 6),
      bookValue: roundTo(cost - annual * year, 6),
    });
  }

  return {
    annualDepreciation: roundTo(annual, 6),
    schedule,
    totalDepreciation: roundTo(cost - salvage, 6),
  };
}

function decliningBalance(cost: number, salvage: number, life: number): DepreciationResult {
  const rate = 1 - (salvage / cost) ** (1 / life);
  const schedule: DepreciationYearEntry[] = [];
  let bookValue = cost;
  let accumulated = 0;

  for (let year = 1; year <= life; year++) {
    const dep = year === life
      ? bookValue - salvage // ensure final book value = salvage
      : bookValue * rate;
    accumulated += dep;
    bookValue -= dep;

    schedule.push({
      year,
      depreciation: roundTo(dep, 6),
      accumulatedDepreciation: roundTo(accumulated, 6),
      bookValue: roundTo(bookValue, 6),
    });
  }

  return {
    annualDepreciation: roundTo(schedule[0].depreciation, 6),
    schedule,
    totalDepreciation: roundTo(cost - salvage, 6),
  };
}
